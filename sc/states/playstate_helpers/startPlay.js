import Paths from "../../backend/Paths.js";
import { Character } from "../../object/character.js";
import { HealthIcon } from "../../object/healthIcon.js";
import { StageWeek1 } from "../stages/StageWeek1.js";
import { TheNothingWorld } from "../stages/TheNothingWorld.js";

// ---------------------------
// FUNCIONES AUXILIARES
// ---------------------------
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
        if (lane < 4) ps.bfNotes.push(noteObj);
        else { noteObj.lane -= 4; ps.dadNotes.push(noteObj); }
      } else {
        if (lane < 4) ps.dadNotes.push(noteObj);
        else { noteObj.lane -= 4; ps.bfNotes.push(noteObj); }
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
      let lane = note[1];
      const sustain = note[2];
      const noteObj = { time, lane: lane % 4, sustain, hit: false };

      if (lane < 4) {
        ps.bfNotes.push(noteObj);
      } else {
        ps.dadNotes.push(noteObj);
      }
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
      const firstNoteTime = section.sectionNotes[0]?.[0] ?? 0;
      ps.bpmSections.push({ time: firstNoteTime + anticipation, bpm: section.bpm });
    }
  });

  if (ps.bpmSections.length === 0)
    ps.bpmSections.push({ time: 0, bpm: defaultBpm });
}

// Función auxiliar para verificar si un archivo existe
async function fileExists(path) {
  try {
    const res = await fetch(path, { method: "HEAD" });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Cargar las voces de los personajes
async function loadCharacterVoices(ps, json) {
  if (!json.song?.needsVoices) return;

  // --- Boyfriend ---
  let bfFile = "Voices.ogg"; // default
  const bfPlayerFile = "Voices-Player.ogg";

  // Si existe Voices-Player, reemplaza Voices
  if (await fileExists(Paths.songVoices(ps.songName, bfPlayerFile))) {
    bfFile = bfPlayerFile;
  }

  // Si boyfriend tiene vocalsFile definido, se carga como "Voices-[vocalsFile].ogg"
  if (ps.boyfriend.vocalsFile?.trim()?.length > 0) {
    const bfVocFile = `Voices-${ps.boyfriend.vocalsFile.trim()}.ogg`;
    if (await fileExists(Paths.songVoices(ps.songName, bfVocFile))) {
      bfFile = bfVocFile;
    }
  }

  ps.boyfriendVoice = new Audio(Paths.songVoices(ps.songName, bfFile));
  ps.boyfriendVoice.volume = 0.5;
  ps.boyfriendVoice.addEventListener("error", () =>
    console.warn("Archivo de voz de BF no encontrado:", bfFile)
  );

  // --- Dad ---
  let dadFile = "Voices-Opponent.ogg"; // default
  const dadOpponentFile = "Voices-Opponent.ogg";

  // Si existe vocalsFile en Dad, se construye el nombre como "Voices-[vocalsFile].ogg"
  if (ps.dad.vocalsFile?.trim()?.length > 0) {
    const dadVocFile = `Voices-${ps.dad.vocalsFile.trim()}.ogg`;
    if (await fileExists(Paths.songVoices(ps.songName, dadVocFile))) {
      dadFile = dadVocFile;
    }
  }

  ps.dadVoice = new Audio(Paths.songVoices(ps.songName, dadFile));
  ps.dadVoice.volume = 0.5;
  ps.dadVoice.addEventListener("error", () =>
    console.warn("Archivo de voz de Dad no encontrado:", dadFile)
  );
}

export async function startPlay(ps, songName) {
  const res = await fetch(Paths.songJSON(songName));
  const json = await res.json();

  // ---------------------------
  // POSICIONES
  // ---------------------------
  const bfPos = json.boyfriend ?? [850, 350]; //850, 350
  const dadPos = json.opponent ?? [100, 50]; //100, 50
  const gfPos = json.girlfriend ?? [500, 50]; //500, 50
  const hideGF = json.hide_girlfriend ?? false;
  const cameraSpeed = json.camera_speed ?? 1;

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
  // AUDIO INSTRUMENTAL
  // ---------------------------
  ps.audioInst = new Audio(Paths.songInst(songName));
  ps.audioInst.volume = 0.5;

  ps.getSongPos = () => ps.audioInst ? ps.audioInst.currentTime * 1000 : 0;

  const charNames = {
    bf: json.song?.player1 ?? "bf",
    dad: json.song?.player2 ?? "dad",
    gf: json.song?.gfVersion ?? "gf"
  };

// ---------------------------
// CREAR SOLO GF ÚNICA
// ---------------------------

let gfInstance = null;

// Crear GF normalmente
try {
  gfInstance = new Character(charNames.gf, false);
  await gfInstance.init({ position: gfPos });
  gfInstance.visible = !hideGF;
} catch {
  gfInstance = new Character("gf", false);
  await gfInstance.init({ position: gfPos });
  gfInstance.visible = !hideGF;
}

// Crear Dad: si apunta a la misma GF, reutilizamos gfInstance
if (charNames.dad === charNames.gf) {
  ps.dad = gfInstance;
  // Opcional: si quieres, ajusta la posición de dad
  ps.dad.x = dadPos[0];
  ps.dad.y = dadPos[1];
} else {
  try {
    ps.dad = new Character(charNames.dad, false);
    await ps.dad.init({ position: dadPos });
  } catch {
    ps.dad = new Character("dad", false);
    await ps.dad.init({ position: dadPos });
  }
}

// Crear Boyfriend normalmente
try {
  ps.boyfriend = new Character(charNames.bf, true);
  await ps.boyfriend.init({ position: bfPos });
  ps.boyfriend.updatePosition();
} catch {
  ps.boyfriend = new Character("bf", true);
  await ps.boyfriend.init({ position: bfPos });
  ps.boyfriend.updatePosition();
}

// Guardamos personajes en array
ps.gf = gfInstance;
ps.characters = [ps.dad, ps.gf, ps.boyfriend];

  loadCharacterVoices(ps, json);

  ps.stage = new StageWeek1(ps);
  await ps.stage.create();

  ps.mustHitSection = false;
  ps.camTarget = ps.mustHitSection ? ps.boyfriend : ps.dad;

ps.moveCameraSection = (sec = null) => {
  if (sec == null) sec = ps.curSection || 0;
  if (!ps.sections?.[sec]) return;

  ps.curSection = sec;
  const section = ps.sections[sec];
  ps.mustHitSection = section.mustHitSection;

  let targetChar, basePos;
  if (ps.mustHitSection) {
    targetChar = ps.boyfriend;
    basePos = bfPos;
  } else {
    targetChar = ps.dad;
    basePos = dadPos;
  }

  if (!targetChar) {
    ps.camTarget = { x: basePos[0], y: basePos[1] };  // Invertir las coordenadas base
    return;
  }

  const [midX, midY] = targetChar.getMidpoint?.() || basePos;
  ps.camTarget = {
    x: (midX + (targetChar.cameraPosition?.[0] || 0)),  // Invertir X
    y: (midY + (targetChar.cameraPosition?.[1] || 0))   // Invertir Y
  };

  console.log(`Cámara movida a: ${ps.camTarget.x}, ${ps.camTarget.y}`);
};

  ps.moveCamera = function (isDad = false) {
    const char = isDad ? this.dad : this.boyfriend;
    if (!char) return;
    const [midX, midY] = char.getMidpoint?.() || [char.x, char.y];
    this.camTarget = {
      x: midX + (char.cameraPosition?.[0] || 0),
      y: midY + (char.cameraPosition?.[1] || 0)
    };
  };

  ps.cameraSpeed = cameraSpeed * 5;

  // ---------------------------
  // DIBUJAR MARCADOR DE CÁMARA
  // ---------------------------
  ps.drawCamMarker = function(ctx) {
    if (!this.camTarget) return;
    ctx.save();
    ctx.fillStyle = this.mustHitSection ? "blue" : "red";
    ctx.beginPath();
    ctx.arc(this.camTarget.x, this.camTarget.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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

  ps.songEvents.sort((a, b) => a.time - b.time);
  ps.nextEventIdx = 0;

  // ---------------------------
  // BEAT TRACKING
  // ---------------------------
  ps.lastBeatTime = 0;
  ps.beatCount = 0;
  ps.lastTimestamp = performance.now();
}
