import Paths from "../../backend/Paths.js";
import { Character } from '../../object/character.js';
import { HealthIcon } from '../../object/healthIcon.js'
import { loadJSON } from "./loadJSON.js";
import { menuDiv } from "./loadMenu.js";

// OJO: recibe la instancia de PlayState como primer parámetro (ps)
export async function startPlay(ps, songName) {
  // JSON de la canción (para stage/bpm/notas)
  const res = await fetch(Paths.songJSON(songName));
  const json = await res.json();

  // Stage name por JSON o default
  let stageName = json.song.stage || "stage";

  // Reset de estado importante
  ps.bfNotes = [];
  ps.dadNotes = [];
  ps.notesPassed = 0;
  ps.eventsPassed = 0;
  ps.totalNotes = 0;
  ps.playing = false;
  ps.ratingSprites = [];
  ps.laneStates = ps.laneStates.map(() => ({ state: "idle", timer: 0, frameIdx: 0 }));
  ps.score = 0;
  ps.ratingsCount = { sick: 0, good: 0, bad: 0, shit: 0 };
  ps.misses = 0;

  // Audio instrumental
  ps.audioInst = new Audio(Paths.songInst(songName));
  ps.audioInst.volume = 0.5;

  // Cargar stage y posiciones
  let bfPos, gfPos, dadPos;
  let camBF, camGF, camDad;
  let cameraSpeed = 1;
  let hideGF = true;

  try {
    const stagePath = Paths.stageJSON(stageName);
    console.log(`📁 Intentando cargar stage desde: ${stagePath}`);
    const stageData = await loadJSON(stagePath);
    const positions = loadStagePositions(stageData);

    // Ejecutar stage.lua si existe
    try {
      const luaPath = Paths.luaStage(stageName);
      console.log(`📁 Intentando cargar script lua desde: ${luaPath}`);
      const luaText = await fetch(luaPath).then((r) => r.text());
      const result = lauxlib.luaL_dostring(ps.L, to_luastring(luaText));
      if (result !== lua.LUA_OK) {
        const err = fengari.to_jsstring(lua.lua_tostring(ps.L, -1));
        console.error(`❌ Error al ejecutar stage.lua: ${err}`);
      } else {
        console.log(`✅ stage.lua cargado y ejecutado correctamente para "${stageName}"`);
      }
    } catch (e) {
      console.warn(`⚠ No se encontró stage.lua para "${stageName}"`);
    }

    bfPos = positions.bfPos;
    gfPos = positions.gfPos;
    dadPos = positions.dadPos;
    camBF = positions.camBF;
    camGF = positions.camGF;
    camDad = positions.camDad;
    cameraSpeed = positions.cameraSpeed;
    hideGF = positions.hideGF;
  } catch (e) {
    console.warn(`⚠ No se pudo cargar el stage "${stageName}". Usando posiciones por defecto.`);
    bfPos = [300, 100];
    gfPos = [100, 100];
    dadPos = [100, 100];
    camBF = bfPos
    camGF = gfPos
    camDad = dadPos;
    cameraSpeed = 1;
    hideGF = true;
  }

ps.boyfriend = new Character("lsw", true);
await ps.boyfriend.init();
ps.boyfriend.pos = bfPos;

ps.dad = new Character("gf", true);
await ps.dad.init();
ps.dad.pos = dadPos;

  ps.gf = new Character("lsw", true);
  await ps.gf.init();
  ps.gf.pos = gfPos;

  // === Cámara target ===
  if (ps.boyfriend) ps.camTarget = ps.boyfriend;
  else if (ps.dad) ps.camTarget = ps.dad;
  else if (ps.gf) ps.camTarget = ps.gf;
  else ps.camTarget = { pos: [ps.FIXED_W / 2, ps.FIXED_H / 2] };

  // Iconos de vida
  ps.iconP1 = await new HealthIcon(ps.boyfriend.healthIcon, true);
  ps.iconP1.visible = !(ps.clientPrefs?.data?.hideHud ?? false);
  ps.iconP1.alpha = ps.clientPrefs.data.healthBarAlpha;
  ps.uiGroup.push(ps.iconP1);

  ps.iconP2 = await new HealthIcon(ps.dad.healthIcon, false);
  ps.iconP2.visible = !(ps.clientPrefs?.data?.hideHud ?? false);
  ps.iconP2.alpha = ps.clientPrefs.data.healthBarAlpha;
  ps.uiGroup.push(ps.iconP2);

  // Al terminar la canción
  ps.audioInst.onended = async () => {
    ps.playing = false;
    ps.pauseBtn.style.display = "none";
    menuDiv.style.display = "block";
    ps.playBtn.style.display = "none";

    ps.bfNotes = [];
    ps.dadNotes = [];
    ps.notesPassed = 0;
    ps.totalNotes = 0;
  };

  // Velocidad / scroll
  const speedMultiplier = json.song.speed || 1;
  ps.fixedSpeed = speedMultiplier * 0.25;
  ps.scrollDuration = 2000 / speedMultiplier;
  ps.baseDistance = Math.abs(ps.bfReceptorY - 30);

  // BPM base
  let bpm = json.song.bpm || 120;
  ps.beatLength = (60000 / bpm) * 2;

  // Notas
  json.song.notes.forEach((section) => {
    section.sectionNotes.forEach((note) => {
      let time = note[0] + ps.anticipationMs;
      let lane = note[1];
      let sustain = note[2];

      if (section.mustHitSection) {
        if (lane < 4) lane += 4;
        else lane -= 4;
      }

      const noteObj = { time, lane, sustain, hit: false };
      if (lane < 4) ps.dadNotes.push(noteObj);
      else ps.bfNotes.push(noteObj);
    });
  });
  ps.totalNotes = ps.bfNotes.length;

  // Eventos de canción
  ps.songEvents = [];
  if (json.song.events && Array.isArray(json.song.events)) {
    json.song.events.forEach((event) => {
      const [time, name, ...params] = event;
      ps.songEvents.push({ time: time + ps.anticipationMs, name, params });
    });
  }

  // BPM dinámico
  ps.bpmSections = [];
  json.song.notes.forEach((section) => {
    if (section.changeBPM) {
      const firstNoteTime = section.sectionNotes.length > 0 ? section.sectionNotes[0][0] : 0;
      ps.bpmSections.push({ time: firstNoteTime + ps.anticipationMs, bpm: section.bpm });
    }
  });
  if (ps.bpmSections.length === 0) ps.bpmSections.push({ time: 0, bpm });

  ps.lastBeatTime = 0;
  ps.beatCount = 0;

  // HUD pos inicial
  ps.lastTimestamp = performance.now();
  ps.repositionHUD();

  // Mostrar botón de play
  ps.playBtn.style.display = "block";

  // Fallback del fondo
  ps.stage = {
    draw: (ctx) => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, ps.W, ps.H);
    }
  };
}
