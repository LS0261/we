import Paths from "../../backend/paths.js";
import { Character } from "../../object/character.js";
import { HealthIcon } from "../../object/healthIcon.js";
import { StageWeek1 } from "../stages/StageWeek1.js";

// ---------------------------
// FUNCIONES AUXILIARES
// ---------------------------

// Detecta el formato del JSON de la canción
function detectJsonFormat(json) {
  if (json.song && Array.isArray(json.song.notes)) return "fnf";
  if (json.notes && Array.isArray(json.notes)) return "simple";
  return "unknown";
}

function startCharacterPos(char, x = 0, y = 0, gfCheck = false) {
  if (!char) return;
  char.positionArray = [x, y];
  char.updatePosition();

  if (gfCheck && char.name.startsWith("gf")) {
    char.scrollFactor = { x: 0.95, y: 0.95 };
    char.danceEveryNumBeats = 2;
  }
}

// ---------------------------
// PARSERS DE NOTAS
// ---------------------------

function parseFNFJson(ps, json) {
  const anticipation = ps.anticipationMs || 0;
  ps.dadNotes = [];
  ps.bfNotes = [];

  json.song.notes.forEach(section => {
    section.sectionNotes.forEach(note => {
      const time = note[0] + anticipation;
      const lane = note[1];
      const sustain = note[2];
      const noteObj = { time, lane, sustain, hit: false };

      if (section.mustHitSection) {
        lane < 4 ? ps.bfNotes.push(noteObj) : ps.dadNotes.push(noteObj);
      } else {
        lane < 4 ? ps.dadNotes.push(noteObj) : ps.bfNotes.push(noteObj);
      }
    });
  });

  ps.totalNotes = ps.bfNotes.length;

  ps.bpmSections = [];
  json.song.notes.forEach(section => {
    if (section.changeBPM) {
      const firstNoteTime = section.sectionNotes.length > 0 ? section.sectionNotes[0][0] : 0;
      ps.bpmSections.push({ time: firstNoteTime + anticipation, bpm: section.bpm });
    }
  });

  if (ps.bpmSections.length === 0) {
    const defaultBpm = json.song.bpm || 120;
    ps.bpmSections.push({ time: 0, bpm: defaultBpm });
  }

  ps.sections = json.song.notes.map((section, i) => ({
    startTime: i * (60000 / (json.song.bpm || 120)) * 4,
    mustHitSection: section.mustHitSection,
    bpm: section.bpm || json.song.bpm || 120
  }));
}

function parseSimpleJson(ps, json) {
  const anticipation = ps.anticipationMs || 0;
  ps.dadNotes = [];
  ps.bfNotes = [];

  json.notes.forEach(section => {
    section.sectionNotes.forEach(note => {
      const time = note[0] + anticipation;
      const lane = note[1];
      const sustain = note[2];
      const noteObj = { time, lane, sustain, hit: false };

      if (section.mustHitSection) lane < 4 ? ps.bfNotes.push(noteObj) : ps.dadNotes.push(noteObj);
      else lane < 4 ? ps.dadNotes.push(noteObj) : ps.bfNotes.push(noteObj);
    });
  });

  ps.totalNotes = ps.bfNotes.length;

  const defaultBpm = json.notes?.[0]?.bpm || 120;
  ps.sections = json.notes.map((section, i) => ({
    startTime: i * (60000 / defaultBpm) * 4,
    mustHitSection: section.mustHitSection,
    bpm: section.bpm || defaultBpm
  }));

  ps.bpmSections = [];
  json.notes.forEach(section => {
    if (section.changeBPM) {
      const firstNoteTime = section.sectionNotes.length > 0 ? section.sectionNotes[0][0] : 0;
      ps.bpmSections.push({ time: firstNoteTime + anticipation, bpm: section.bpm });
    }
  });

  if (ps.bpmSections.length === 0) ps.bpmSections.push({ time: 0, bpm: defaultBpm });
}

// ---------------------------
// FUNCION PRINCIPAL
// ---------------------------

export async function startPlay(ps, songName) {
  const res = await fetch(Paths.songJSON(songName));
  const json = await res.json();

  // ---------------------------
  // POSICIONES
  // ---------------------------
  const bfPos = json.song?.boyfriendPos ?? [650, 150];
  const dadPos = json.song?.dadPos ?? [50, 150];
  const gfPos = json.song?.gfPos ?? [440, 50];
  const hideGF = json.song?.hideGF ?? false;
  const cameraSpeed = json.song?.cameraSpeed ?? 1;

  // ---------------------------
  // RESET ESTADO
  // ---------------------------
  ps.bfNotes = [];
  ps.dadNotes = [];
  ps.notesPassed = 0;
  ps.eventsPassed = 0;
  ps.totalNotes = 0;
  ps.playing = false;
  ps.ratingSprites = [];
  ps.laneStatesPlayer = Array(4).fill(0).map(() => ({ state: "idle", timer: 0, frameIdx: 0 }));
  ps.laneStatesDad = Array(4).fill(0).map(() => ({ state: "idle", timer: 0, frameIdx: 0 }));
  ps.score = 0;
  ps.ratingsCount = { sick: 0, good: 0, bad: 0, shit: 0 };
  ps.misses = 0;
  ps.uiGroup = ps.uiGroup || [];

  // ---------------------------
  // AUDIO
  // ---------------------------
  ps.audioInst = new Audio(Paths.songInst(songName));
  ps.audioInst.volume = 0.5;

  ps.audioVoices = new Audio(Paths.songVoices(songName));
  ps.audioVoices.volume = 0.5;
  ps.audioVoices.addEventListener("error", () => (ps.audioVoices = null));

  ps.getSongPos = () => {
  if (ps.audioInst) return ps.audioInst.currentTime * 1000;
  return 0;
};
  // ---------------------------
  // PERSONAJES
  // ---------------------------
  const charNames = {
    bf: json.song?.characters?.bf ?? "bf",
    dad: json.song?.characters?.dad ?? "dad",
    gf: json.song?.characters?.gf ?? "gf"
  };

  ps.dad = new Character("ruv", false);
  await ps.dad.init();
  startCharacterPos(ps.dad, dadPos[0], dadPos[1]);

  ps.gf = new Character(charNames.gf, false);
  await ps.gf.init();
  startCharacterPos(ps.gf, gfPos[0], gfPos[1]);
  ps.gf.visible = !hideGF;

  ps.boyfriend = new Character("lsw", true);
  await ps.boyfriend.init();
  startCharacterPos(ps.boyfriend, bfPos[0], bfPos[1]);

  ps.characters = [ps.dad, ps.gf, ps.boyfriend];

  // ---------------------------
  // STAGE
  // ---------------------------
  ps.stage = new StageWeek1(ps);
  await ps.stage.create();

  ps.mustHitSection = false;
  ps.camTarget = ps.mustHitSection ? ps.boyfriend : ps.dad;

  ps.moveCameraSection = (i) => {
  const section = ps.sections?.[i];
  if (!section) return;

  ps.mustHitSection = section.mustHitSection;
  ps.camTarget = ps.mustHitSection ? ps.boyfriend : ps.dad;

  // Posición base
  ps.camX = ps.camTarget.x;
  ps.camY = ps.camTarget.y;

  // Opcional: si hay una posición especial de cámara en ese personaje
  if (ps.camTarget.cameraPosition) {
    ps.camX += ps.camTarget.cameraPosition[0];
    ps.camY += ps.camTarget.cameraPosition[1];
  }
};

  ps.cameraSpeed = cameraSpeed;
  ps.camX = ps.camTarget.x;
  ps.camY = ps.camTarget.y;

ps.updateCamera = () => {
  if (!ps.camTarget || !ps.camGame || typeof ps.camGame.follow !== "function") return;

  const songPos = ps.getSongPos();
  for (let i = 0; i < ps.sections.length; i++) {
    const sec = ps.sections[i];
    const nextSec = ps.sections[i + 1];
    if (songPos >= sec.startTime && (!nextSec || songPos < nextSec.startTime)) {
      ps.curSection = i;
      ps.moveCameraSection(i);
      break;
    }
  }

  ps.camFollowX = ps.camFollowX ?? ps.camX;
  ps.camFollowY = ps.camFollowY ?? ps.camY;

  ps.camFollowX += (ps.camX - ps.camFollowX) * 0.01 * ps.cameraSpeed;
  ps.camFollowY += (ps.camY - ps.camFollowY) * 0.01 * ps.cameraSpeed;

  ps.camGame.follow(ps.camFollowX, ps.camFollowY);
};

  // ---------------------------
  // HUD
  // ---------------------------
  ps.iconP1 = new HealthIcon(ps.boyfriend.healthIcon, true);
  ps.iconP1.visible = !(ps.clientPrefs?.data?.hideHud ?? false);
  ps.iconP1.alpha = ps.clientPrefs?.data.healthBarAlpha;
  ps.uiGroup.push(ps.iconP1);

  ps.iconP2 = new HealthIcon(ps.dad.healthIcon, false);
  ps.iconP2.visible = !(ps.clientPrefs?.data?.hideHud ?? false);
  ps.iconP2.alpha = ps.clientPrefs?.data.healthBarAlpha;
  ps.uiGroup.push(ps.iconP2);

  // ---------------------------
  // SCROLL Y BPM
  // ---------------------------
  const speedMultiplier = json.song?.speed ?? 1;
  ps.fixedSpeed = speedMultiplier * 1.25;
  ps.scrollDuration = 1000 / speedMultiplier;
  ps.baseDistance = Math.abs(ps.bfReceptorY - 30);
  const bpm = json.song?.bpm ?? json.notes?.[0]?.bpm ?? 120;
  ps.beatLength = (60000 / bpm) * 2;

  // ---------------------------
  // PARSEAR NOTAS
  // ---------------------------
  const format = detectJsonFormat(json);
  switch (format) {
    case "fnf": parseFNFJson(ps, json); break;
    case "simple": parseSimpleJson(ps, json); break;
    default: console.error("❌ Formato de canción no reconocido."); return;
  }

  // ---------------------------
  // EVENTOS
  // ---------------------------
  ps.songEvents = [];

  // 1️⃣ Eventos del JSON principal
  if (json.song?.events) {
    json.song.events.forEach(event => {
      const [time, subEvents] = event;
      if (Array.isArray(subEvents)) {
        subEvents.forEach(sub => {
          const [name, ...params] = sub;
          ps.songEvents.push({ time: (time ?? 0) + (ps.anticipationMs || 0), name, params });
        });
      }
    });
  }

  // 2️⃣ Intentar cargar events.json externo
  try {
    const eventsRes = await fetch(Paths.songData(songName) + "/events.json");
    if (eventsRes.ok) {
      const externalEvents = await eventsRes.json();
      externalEvents.forEach(event => {
        const [time, subEvents] = event;
        if (Array.isArray(subEvents)) {
          subEvents.forEach(sub => {
            const [name, ...params] = sub;
            ps.songEvents.push({ time: (time ?? 0) + (ps.anticipationMs || 0), name, params });
          });
        }
      });
    }
  } catch (e) {
    console.warn("No se encontró events.json o hubo un error al cargarlo:", e);
  }

  // 3️⃣ Ordenar eventos por tiempo
  ps.songEvents.sort((a, b) => a.time - b.time);

  // ---------------------------
  // BEAT TRACKING
  // ---------------------------
  ps.lastBeatTime = 0;
  ps.beatCount = 0;
  ps.lastTimestamp = performance.now();
}
