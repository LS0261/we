// PlayState.js

import { Character } from "../object/character.js";
import Paths from "../backend/Paths.js";
import Bar from "../object/bar.js";
import HealthIcon from "../object/healthIcon.js";
import ClientPrefs from "../backend/clientPrefs.js";
import { registerStageLuaFunctions } from "../luabridge/stageBridge.js";
import { Camera } from "./camera.js";
import AssetsLoader from "../backend/assetsLoader.js";
import NotesAssets, { NotesAssetsPromise } from '../object/notes.js';
import HealthBar from "../object/healthBar.js";

import { loadJSON } from "./playstate_helpers/loadJSON.js";
import { setupButtons } from "./playstate_helpers/setupButtons.js";
import { startCountdown } from "./playstate_helpers/countdown.js";
import { startPlay } from "./playstate_helpers/startPlay.js";
import { runEvent } from "./playstate_helpers/runEvent.js";
import { repositionHUD } from "./playstate_helpers/repositionHUD.js";
import { bindInputs } from "./playstate_helpers/bindInputs.js";
import { addRatingSprite } from "./playstate_helpers/addRatingSprite.js";
import { drawProgressBar } from "../object/drawProgressBar.js";
import { calculateNoteY } from "./playstate_helpers/calculateNoteY.js";
import { updateHealthIcons } from "./playstate_helpers/updateHealthIcons.js";
import { drawStrumline } from "./playstate_helpers/drawStrumline.js"
import { calculateAccuracy } from "./playstate_helpers/calculateAccuracy.js"
import { renderStrums } from "./playstate_helpers/renderStrums.js";
import { renderNotes } from "./playstate_helpers/renderNotes.js";
import { tryHitLane, createTouchLanes, updateHoldNotes} from "./playstate_helpers/tryHitLane.js";
import { handleMouseTouch, handleTouches } from "./playstate_helpers/handleInputs.js";

import ChartingState from "./editors/ChartingState.js";
import CustomFadeTransition from "../backend/CustomFadeTransition.js";
import PauseMenuSubstate from "./substates/pausemenusubstate.js";
import GameOverState from "./substates/gameoverstate.js";

const loader = new AssetsLoader();

// ==== LUA (Fengari) ====
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;
const to_luastring = fengari.to_luastring;

export default class PlayState {
  constructor(game, songName) {
    // LLAMADAS A HELPERS para inicializar lógica
    this.game = game;
    this.songName = songName;
    
    this.menuMusic = null;

    this.clientPrefs = new ClientPrefs();
    this.clientPrefs.loadPrefs();

    this.FIXED_W = 1280;
    this.FIXED_H = 720;
    this.container = document.getElementById("gameContainer");
    const width = 1280;
    const height = 720;
    this.W = width;
    this.H = height;
    this.camGame = new Camera(this.container, 1);
    this.camHUD = new Camera(this.container, 2);
    this.container.appendChild(this.camGame.canvas);
    this.container.appendChild(this.camHUD.canvas);

    this.camGame.canvas.width = width;
    this.camGame.canvas.height = height;
    this.camHUD.canvas.width = width;
    this.camHUD.canvas.height = height;

    this.gameCanvas = this.camGame.canvas;
    this.hudCanvas = this.camHUD.canvas;
    this.ctxGame = this.camGame.ctx;
    this.ctxHUD = this.camHUD.ctx;

this.baseCamGameZoom = 1.0;   // equivalente a defaultCamZoom
this.baseCamHUDZoom  = 1.0;

this.camGameZoom = this.baseCamGameZoom;
this.camHUDZoom  = this.baseCamHUDZoom;

this.camGameZoomTarget = this.camGameZoom;
this.camHUDZoomTarget  = this.camHUDZoom;

    // Inicializar LUA VM
    this.L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(this.L);
    registerStageLuaFunctions(this.L);

    this.fixedSpeed = 1.5;
    this.bpmSections = [];

    this.bfNotes = [];
    this.dadNotes = [];
    this.uiGroup = [];

    this.notesPassed = 0;
    this.totalNotes = 0;
    // velocidad de scroll del chart (si no viene, usa 1.0)
    this.scrollSpeed = this.scrollSpeed ?? 1.0;

    // bpm base (si el chart no tiene secciones aún, usa 120)
    this.songBpm = this.songBpm ?? 120;

    // duración de 4 beats en ms
    this.scrollDuration = (60000 / this.songBpm) * 4;

    // distancia en píxeles que recorre en esos 4 beats
    this.baseDistance = 160 * this.scrollSpeed * 4;

    // posición de receptores
    this.dadReceptorY = 0;
    this.bfReceptorY = this.dadReceptorY;
    this.anticipationMs = 0;
    this.lastTimestamp = 0;
    this.audioInst = null;
    this.playing = false;

    this.playerHealth = 50;
    this.playerMaxHealth = 100;
    this.targetHealth = 50;

    this.cameraLerp = 0.04;

this.ratingSprites = [];
    this.iconP1 = null;
    this.iconP2 = null;

    // Personajes
    this.boyfriend = null;
    this.gf = null;
    this.dad = null;
    // INPUT / lanes
    this.hitWindow = 0; // ms
    //this.hitWindowBF = 150; // ms
this.hitWindowBFMin = -150;
this.hitWindowBFMax = 150;

    this.hitWindowDad = 50; // ms

    this.autoPlay = false;
    this.botplayAlpha = 0;      // alpha actual
this.botplayAlphaTarget = 0; // alpha hacia donde va

this.updateKeyToLane = () => {
  this.keyToLane = {};

  const binds = this.clientPrefs.keyBinds;

  binds.note_left.forEach(code => this.keyToLane[code] = 0);
  binds.note_down.forEach(code => this.keyToLane[code] = 1);
  binds.note_up.forEach(code => this.keyToLane[code] = 2);
  binds.note_right.forEach(code => this.keyToLane[code] = 3);
};

// Inicializa keyToLane
this.updateKeyToLane();


    bindInputs(this);

window.addEventListener("keydown", (e) => {
  if (e.repeat) return; // ❌ evita repetir cuando la tecla está mantenida

  const laneIdx = this.keyToLane[e.code];
  if (laneIdx !== undefined) {
    tryHitLane(this, laneIdx);
    this.lanesHeld[laneIdx].held = true; // para notas hold

  }
});
createTouchLanes(this);
window.addEventListener("keyup", (e) => {
  const laneIdx = this.keyToLane[e.code];
  if (laneIdx !== undefined) {
    this.lanesHeld[laneIdx].held = false;
    this.lanesHeld[laneIdx].holdNote = null;
  }
});

    this.lanesHeld = [
      { held: false, holdNote: null },
      { held: false, holdNote: null },
      { held: false, holdNote: null },
      { held: false, holdNote: null },
    ];

    this.metronome1 = new Audio(Paths.metronome1);
    this.metronome2 = new Audio(Paths.metronome2);

    this.laneStatesPlayer = [
      { state: "idle", timer: 0, frameIdx: 0 },
      { state: "idle", timer: 0, frameIdx: 0 },
      { state: "idle", timer: 0, frameIdx: 0 },
      { state: "idle", timer: 0, frameIdx: 0 },
    ];

    this.laneStatesDad = [
      { state: "idle", timer: 0, frameIdx: 0 },
      { state: "idle", timer: 0, frameIdx: 0 },
      { state: "idle", timer: 0, frameIdx: 0 },
      { state: "idle", timer: 0, frameIdx: 0 },
    ];

    this.calculateAccuracy = () => calculateAccuracy(this);
    this.combo = 0;
    this.laneDirs = ["left", "down", "up", "right"];
    this.score = 0;
    this.ratingsCount = { sick: 0, good: 0, bad: 0, shit: 0, miss: 0 };
    this.misses = 0;

    this.dadReceptorY = this.H * 0.10;
    this.bfReceptorY = this.H * 0.1;
    //this.baseDistance = this.bfReceptorY + 1; // o altura de pantalla - receptorY

    this.gameZoom = 0.7;

    // HUD zoom + metrónomo
    this.hudZoom = 1;
    this.hudZoomTarget = 1;
    this.beatLength = 60000 / 120;
    this.lastBeatTime = 0;
    this.beatCount = 0;
    
    // Helpers que manejan UI, menú, inputs, etc.
    setupButtons(this);
    bindInputs(this);
     this.createMobileControls = () => {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.left = '50%';
      container.style.transform = 'translateX(-50%)';
      container.style.display = 'flex';
      container.style.gap = '10px';
      container.style.zIndex = '9999';
      document.body.appendChild(container);

      const btnAutoPlay = document.createElement('button');
      btnAutoPlay.textContent = 'AutoPlay';
      btnAutoPlay.style.padding = '10px 20px';
      btnAutoPlay.style.fontSize = '16px';
      btnAutoPlay.
      addEventListener('touchstart', (e) => {
  e.preventDefault();
  this.autoPlay = !this.autoPlay;
  this.botplayAlphaTarget = this.autoPlay ? 1 : 0; // 👈 target del fade
  console.log(`AutoPlay ${this.autoPlay ? "activado" : "desactivado"}`);
});
//container.appendChild(btnAutoPlay);

      const btnChart = document.createElement('button');
      btnChart.textContent = 'Chart Editor';
      btnChart.style.padding = '10px 20px';
      btnChart.style.fontSize = '16px';
      btnChart.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.openChartingEditor();
      });
      //container.appendChild(btnChart);
    };

    // Llamar la función para crear los botones
    this.createMobileControls();

    window.addEventListener("resize", () => repositionHUD(this));

    //this.camTarget = { pos: [this.FIXED_W/2, this.FIXED_H/2] };

    this.camTarget = {
      x: this.FIXED_W / 2,
      y: this.FIXED_H / 2
    };

    this.initAssetsAndLoop();

    if (this.songName) {
      this.startSong(this.songName);
    }

    if (this.game.menuMusic) {
      this.game.menuMusic.pause();
      this.game.menuMusic = null;
    }
    this.camFollow = { x: 0, y: 0 }; // hacia dónde apunta la cámara
this.camPos = { x: 0, y: 0 };    // posición real (interpolada)
this.camPos = { 
  x: this.FIXED_W / 2, 
  y: this.FIXED_H / 2 
};
    const scrollTime = this.scrollDuration / 1000 / this.fixedSpeed; // en segundos

    this.healthBar = new HealthBar(() => this.playerHealth, this.playerMaxHealth, false);

    //this.healthBar.setColors("#f00", "#0f0");

    this.pauseMenu = new PauseMenuSubstate(this);  
    //window.addEventListener("resize", () => this.resize());
  //window.addEventListener("orientationchange", () => this.resize());
  }
  /*resize() {
  const width = this.container.clientWidth;
  const height = this.container.clientHeight;

  this.W = width;
  this.H = height;

  this.camGame.canvas.width = width;
  this.camGame.canvas.height = height;
  this.camGame.width = width;
  this.camGame.height = height;

  this.camHUD.canvas.width = width;
  this.camHUD.canvas.height = height;
  this.camHUD.width = width;
  this.camHUD.height = height;

  // Escalar contextos al FIXED_W/FIXED_H
  const scaleX = width / this.FIXED_W;
  const scaleY = height / this.FIXED_H;

  this.ctxGame.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  this.ctxHUD.setTransform(scaleX, 0, 0, scaleY, 0, 0);
}
*/

  async initAssetsAndLoop() {
    try {
      await NotesAssetsPromise; // espera a que se cargue XML + imágenes
      console.log("NotesAssets cargado ✅, iniciando loop");
      await document.fonts.load('40px VRCFont'); // espera a que VRCFont esté lista
      // Ahora sí se puede iniciar el loop
      this.lastTimestamp = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    } catch (err) {
        console.error("Error cargando NotesAssets:", err);
    }
  }
 
startSong(songName) {
  // ⚠️ Guardar lo que devuelve startPlay
  const ps = startPlay(this, songName);
  this.playing = true;              // ✅ activa el loop de notas

for (let [k, v] of Object.entries(ps)) {
  if (v !== undefined) this[k] = v; // acepta funciones también
}

  // Esperar 1000ms (1 segundo) antes de iniciar el conteo
setTimeout(() => {
  startCountdown(this, () => {
    // cuando termina el countdown
    if (this.audioInst) {
      // Verificar que el audio esté cargado y que exista antes de reproducirlo
      if (this.audioInst instanceof HTMLAudioElement) {
        this.audioInst.currentTime = Math.max(0, -this.anticipationMs / 1000);
        this.audioInst.play().catch(err => console.error("Error al reproducir audioInst:", err));
      }
    }
    
    if (this.dadVoice) {
      // Verificar que el audio esté cargado y que exista antes de reproducirlo
      if (this.dadVoice instanceof HTMLAudioElement) {
        this.dadVoice.currentTime = Math.max(0, -this.anticipationMs / 1000);
        this.dadVoice.play().catch(err => console.error("Error al reproducir dadVoice:", err));
      }
    }
    
    if (this.boyfriendVoice) {
      // Verificar que el audio esté cargado y que exista antes de reproducirlo
      if (this.boyfriendVoice instanceof HTMLAudioElement) {
        this.boyfriendVoice.currentTime = Math.max(0, -this.anticipationMs / 1000);
        this.boyfriendVoice.play().catch(err => console.error("Error al reproducir boyfriendVoice:", err));
      }
    }
  });
}, 1500);

}

getSongPos() {
  if (!this.audioInst) return this.anticipationMs;
  if (!this.playing) return this.anticipationMs;
  return this.audioInst.currentTime * 1000 + this.anticipationMs;
}

  runEvent(name, params) {
    runEvent(this, name, params);
  }

  repositionHUD() {
    repositionHUD(this);
  }

updateCamera() {
  let target = this.camTarget || null;
  if (!target) return;

  // Posición media + offset de cámara
  const mid = target.getMidpoint?.() || [target.x + (target.width || 0) / 2, target.y + (target.height || 0) / 2];
  const camPos = target.getCameraPosition ? target.getCameraPosition() : mid;

  // Inicializar camPos si no existe
  if (!this.camPos) this.camPos = { x: camPos[0], y: camPos[1] };

  // Suavizado
  this.camPos.x += (camPos[0] - this.camPos.x) * this.cameraLerp;
  this.camPos.y += (camPos[1] - this.camPos.y) * this.cameraLerp;

  // Guardar posición en la cámara
  this.camGame.x = this.camPos.x;
  this.camGame.y = this.camPos.y;

  // 🔹 Debug opcional
  if (this.showCamDebug) {
    const ctx = this.camGame.ctx;
    ctx.save();
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.camPos.x, this.camPos.y, 5 / this.camGame.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

  onSongEnd() {
    console.log("Canción terminada 🎵, regresando a Freeplay...");
    this.playMenuMusic();
    new CustomFadeTransition(this.game, 1.0, () => {
      this.destroy();
      import("./FreeplayState.js").then(({ default: FreeplayState }) => {
        this.game.changeState(new FreeplayState(this.game));
      });
    });
  }
playMenuMusic() {
  if (!this.game.menuMusic) {
    const audioPath = Paths.music('freakyMenu');
    this.game.menuMusic = new Audio(audioPath);
    this.game.menuMusic.loop = true;
    this.game.menuMusic.volume = 0.6; // volumen directo sin fade
    this.game.menuMusic.play().catch(console.error);
  }
}

loop(timestamp) {
if (this.destroyed || this._paused) return;

  const delta = (timestamp - this.lastTimestamp) / 1000;
  this.lastTimestamp = timestamp;
  if (!this.audioInst || this.audioInst.paused) {
  this.anticipationMs += delta * 1000;
}
  if (this.anticipationMs < 0) {
  this.anticipationMs += delta * 1000; // sube 1000ms por segundo
}
  requestAnimationFrame((t) => this.loop(t));

  const ctxGame = this.ctxGame;
  const ctxHUD = this.ctxHUD;

  const songPos = this.getSongPos();

  if (this.playing && this.anticipationMs < 0) {
  this.anticipationMs += delta * 1000; // sube 1000 ms por segundo
  if (this.anticipationMs > 0) this.anticipationMs = 0;
}

if (this.songEvents && Array.isArray(this.songEvents)) {
    while (this.nextEventIdx < this.songEvents.length && songPos >= this.songEvents[this.nextEventIdx].time) {
        const ev = this.songEvents[this.nextEventIdx];
        this.triggerEvent(ev.name, ev.params[0], ev.params[1], ev.params[2]);
        this.nextEventIdx++;
    }
} else {
    //console.warn("No hay eventos de canción o están mal definidos.");
}

//console.log("songPos:", songPos, "duration*1000:", this.audioInst.duration*1000);
if (this.playing && this.audioInst && songPos >= this.audioInst.duration * 1000 - 50) {
    console.log("Canción terminada 🎵, regresando a Freeplay...");
    this.playing = false;
    this.onSongEnd();
    return;
}

this.camGame.zoom = this.camGameZoom;
this.updateCamera();
this.boyfriend?.update(delta);
this.dad?.update(delta);
this.gf?.update(delta);
this.stage?.update(delta);
this.createTouchLanes?.update(delta);

this.camGame.zoom = this.camGameZoom;
//this.camGame.rotation += 0.001; // rotación suave en radianes
this.camGame.begin();
this.stage?.draw(this.camGame.ctx, this.camGame);

this.gf?.draw(this.camGame.ctx);
this.dad?.draw(this.camGame.ctx);
this.boyfriend?.draw(this.camGame.ctx);
this.camGame.end();
this.createTouchLanes?.draw(this.camHUD.ctx);

  // ---------------- HUD LAYER ----------------
  ctxHUD.setTransform(1, 0, 0, 1, 0, 0);
  ctxHUD.clearRect(0, 0, this.hudCanvas.width, this.hudCanvas.height);

if (this.countdownText) {
    const spr = this.countdownSprites?.[this.countdownText];
    if (spr && spr.image) {
        // centramos en el HUD usando el tamaño real
        spr.screenCenter(); 
        spr.draw(this.ctxHUD);
    }
}

  ctxHUD.save();
  const hudZoom = this.camHUDZoom;
  ctxHUD.translate(this.W / 2, this.H / 2);
  ctxHUD.scale(hudZoom, hudZoom);
  ctxHUD.translate(-this.W / 2, -this.H / 2);

this.healthBar.update(delta);
this.healthBar.draw(this.camHUD.ctx);

if (this.iconP1 && this.iconP2 && this.healthBar) {
  this.iconP1.update();
  this.iconP2.update();

  const hb = this.healthBar;
  const barX = hb.bg.pos[0];
  const barY = hb.bg.pos[1];
  const barW = hb.barWidth;
  const barH = hb.barHeight;

  const center = barW / 2;
  const offset = (hb.displayedPercent - 0.5) * barW;

  // centro real de la barra
  const barCenter = barX + 3 + (center - offset);
  const healthPercent = hb.displayedPercent;

  // Oponente (P2) → borde derecho al centro
  this.iconP2.x = barCenter - this.iconP2.getFrameWidth() / 3.5;
  this.iconP2.y = barY + barH / 2 - this.iconP2.getFrameHeight() / 2;

  // Jugador (P1) → borde izquierdo al centro
  this.iconP1.x = barCenter - this.iconP1.getFrameWidth() / 1.2;
  this.iconP1.y = barY + barH / 2 - this.iconP1.getFrameHeight() / 2;

  this.iconP2.draw(ctxHUD, healthPercent, false);
  this.iconP1.draw(ctxHUD, healthPercent, true);
}

  const strumSpacing = Math.min(this.W * 0.08, 100);
  const strumSize = strumSpacing;
  const holdWidth = strumSize * 0.4;
  const startX_opp = this.W * 0.1;
  const startX_player = this.W - strumSpacing * 4 - this.W * 0.1;

  renderStrums(this, ctxHUD, this.dadReceptorY, strumSize, startX_opp, strumSpacing, this.laneStatesDad, false, delta);
  renderNotes(this, ctxHUD, this.dadNotes, false, startX_opp, strumSpacing, strumSize, holdWidth, this.dadReceptorY, songPos, true);

  renderStrums(this, ctxHUD, this.bfReceptorY, strumSize, startX_player, strumSpacing, this.laneStatesPlayer, true, delta);
  renderNotes(this, ctxHUD, this.bfNotes, true, startX_player, strumSpacing, strumSize, holdWidth, this.bfReceptorY, songPos, true);

  ctxHUD.fillStyle = "#fff";
  ctxHUD.font = "20px 'VRCFont' ";
  const hudTextY = (this.healthBar?.y) + 40 * 1.5;
  const accuracy = this.calculateAccuracy?.();
  ctxHUD.textAlign = "center";
  ctxHUD.fillText(`Score: ${this.score} | Misses: ${this.misses} | Accuracy: ${accuracy.toFixed(1)}%`, this.W / 2, hudTextY);
  ctxHUD.textAlign = "start";

  if (this.ratingSprites?.length) {
    for (let i = this.ratingSprites.length - 1; i >= 0; i--) {
      const s = this.ratingSprites[i];
      s.timer += delta;
      s.vy += s.gravity;
      s.y += s.vy;
      if (s.timer > 0.3) s.alpha -= 0.02;
      if (s.alpha <= 0) this.ratingSprites.splice(i, 1);
      else {
        ctxHUD.globalAlpha = s.alpha;
        ctxHUD.drawImage(s.img, s.x, s.y, 100, 50);
        ctxHUD.globalAlpha = 1;
      }
    }
  }

  // ---------------- BPM + ZOOMS ----------------
  let currentBpm = this.bpmSections[0]?.bpm ?? 120;
  let currentBeatLength = 60000 / currentBpm;
  for (let i = 0; i < this.bpmSections.length; i++) {
    if (songPos >= this.bpmSections[i].time) {
      currentBpm = this.bpmSections[i].bpm;
      currentBeatLength = 60000 / currentBpm;
    } else break;
  }

  if (!this.idleBeatCounter) this.idleBeatCounter = 0;

// ---------------- BEATS + ZOOMS ----------------
if (songPos - this.lastBeatTime >= currentBeatLength - 5) {
  this.beatCount = (this.beatCount + 1) % 4;

  // --- mover cámara por sección ---
  if (this.sections) {
    for (let i = 0; i < this.sections.length; i++) {
      const sec = this.sections[i];
      const nextSec = this.sections[i + 1];
      if (songPos >= sec.startTime && (!nextSec || songPos < nextSec.startTime)) {
        if (this.curSection !== i) {
          this.curSection = i;
          this.moveCameraSection(i);
        }
        break;
      }
    }
  }

  // --- onBeat de los íconos (cada beat) ---
  if (this.iconP1) this.iconP1.onBeat();
  if (this.iconP2) this.iconP2.onBeat();

  // --- animaciones idle + zoom cada 2 beats ---
  this.idleBeatCounter++;
  if (this.idleBeatCounter >= 2) { // 🔹 cada 2 beats
if (this.boyfriend) this.boyfriend.onBeat(currentBeatLength / 1000);

if (this.dad) this.dad.onBeat(currentBeatLength / 1000);

    if (this.gf) {
      this.camGameZoom += 0.006;
      this.camHUDZoom += 0.008;
      this.hudZoom = 1.1;
      this.camGame.follow(this.dad.x, this.dad.y);
      // GF dance
      this.gfDanceState = (this.gfDanceState === "danceLeft") ? "danceRight" : "danceLeft";
      this.gf.playAnim(this.gfDanceState, true);
    }

    this.idleBeatCounter = 0;
  }

  // --- avanzar beat ---
  this.lastBeatTime += currentBeatLength;
  if (songPos - this.lastBeatTime > currentBeatLength) {
    this.lastBeatTime = songPos;
  }
}

  const defaultGameZoom = 0.7;
  const defaultHUDZoom = 1.0;

  this.camGameZoom += (defaultGameZoom - this.camGameZoom) * 0.02;
  this.camHUDZoom += (defaultHUDZoom - this.camHUDZoom) * 0.03;
  this.hudZoom += (1 - this.hudZoom) * 0.1;

  (window.__CHAR_INSTANCES || []).forEach(c => {
    if (c !== this.boyfriend && c.isPlayer && c.name === this.boyfriend.name) {
      console.log("Eliminando clon BF", c);
    }
  });
//this.camGameZoom = 0.4;
  // ---------------- VIDA ----------------
  const smoothSpeed = 3;
  this.playerHealth += (this.targetHealth - this.playerHealth) * smoothSpeed * delta;
  if (Math.abs(this.targetHealth - this.playerHealth) < 0.001) this.playerHealth = this.targetHealth;

if (this.playerHealth <= 0 && !this.gameOverTriggered) {
  this.gameOverTriggered = true;

  // Detener loop actual de PlayState
  this.playing = false;

  const gameOver = new GameOverState(this);
  gameOver.start();
  return; // sale del loop para que GameOverState tome control
}
/*
// ---------------- BF HOLD NOTES ----------------
for (let i = this.bfNotes.length - 1; i >= 0; i--) {
    const note = this.bfNotes[i];

    // Skip si ya fue hit
    if (note.hit) continue;

    const lane = this.lanesHeld[note.lane];

    // Iniciar sustain si aún no empezó
    if (note.sustain > 0 && this.getSongPos() >= note.time && !lane.held) {
        lane.held = true;
        lane.holdNote = note;
    }

    // Terminar sustain
    if (note.sustain > 0 && this.getSongPos() >= note.time + note.sustain) {
        note.hit = true;
        lane.held = false;
        lane.holdNote = null;

        this.bfNotes.splice(i, 1);
        this.combo++;
        this.score += 300;
    }

    // Notas normales
    if (note.sustain === 0 && Math.abs(this.getSongPos() - note.time) <= this.hitWindowDad) {
        note.hit = true;
        this.bfNotes.splice(i, 1);

        lane.state = "confirm";
        lane.timer = 9;
        lane.frameIdx = 0;

        this.combo++;
        this.score += 300;
    }
}
*/
//drawProgressBar(this, ctxHUD);

if (this.botplayAlpha > 0.01) {
  ctxHUD.save();
  ctxHUD.globalAlpha = this.botplayAlpha;
  ctxHUD.fillStyle = 'white';
  ctxHUD.font = "40px VRCFont";
  ctxHUD.textAlign = 'center';
  const centerX = this.W / 2;
  const centerY = this.bfReceptorY + 50;
  ctxHUD.fillText('BOTPLAY', centerX, centerY);
  ctxHUD.restore();
}

// transición alpha del BOTPLAY
const alphaSpeed = 5 * delta; // velocidad del tween
this.botplayAlpha += (this.botplayAlphaTarget - this.botplayAlpha) * alphaSpeed;
 /* // ---------------- ELIMINAR NOTAS P1 ----------------
for (let i = this.bfNotes.length - 1; i >= 0; i--) {
  const note = this.bfNotes[i];
  if (note.hit) continue;

  const isHolding =
    note.sustain > 0 &&
    this.lanesHeld[note.lane]?.holdNote === note;

  // ⛔ NO eliminar holds activos
  if (isHolding) continue;

  if (songPos - note.time > this.hitWindow) {
    note.hit = true;

    const anims = ["singLEFTmiss", "singDOWNmiss", "singUPmiss", "singRIGHTmiss"];
    this.boyfriend?.playAnim(anims[note.lane], true);

    this.combo = 0;
    this.playerHealth = Math.max(0, this.playerHealth - 5);

    this.bfNotes.splice(i, 1);
    //this.targetHealth -= 2;
  }
}
*/
// ---------------- NOTAS DAD ----------------
for (let i = this.dadNotes.length - 1; i >= 0; i--) {
  const note = this.dadNotes[i];
  if (note.hit) continue;

  // ventana automática de hit
  if (songPos >= note.time - this.hitWindowDad && songPos <= note.time + this.hitWindowDad) {

    // Validar lane
    if (note.lane < 0 || note.lane > 3 || isNaN(note.lane)) {
      console.warn("⚠️ Nota inválida para DAD:", note);
      this.dadNotes.splice(i, 1);
      continue;
    }

    const anims = ["singLEFT", "singDOWN", "singUP", "singRIGHT"];
    this.dad?.playAnim(anims[note.lane], true);

    const laneState = this.laneStatesDad[note.lane];
    laneState.state = "confirm";
    laneState.timer = 9;
    laneState.frameIdx = 0;

    // 🔥 HOLD NOTE
    if (note.sustain > 0) {
      const lane = this.lanesHeldDad[note.lane];
      lane.held = true;          // DAD nunca suelta
      lane.holdNote = note;      // iniciar sustain
      note.hit = false;          // todavía NO termina
    }
    // 🔹 NOTA NORMAL
    else {
      note.hit = true;
      this.dadNotes.splice(i, 1);
    }
  }
  this.camGameZoom += (this.camGameZoomTarget - this.camGameZoom) * this.cameraLerp;
  this.camHUDZoom  += (this.camHUDZoomTarget  - this.camHUDZoom)  * this.cameraLerp;

  // aplicar zoom real en la cámara
  this.camGame.setZoom(this.camGameZoom);
  this.camHUD.setZoom(this.camHUDZoom);
}

  // ---------------- AUTOPLAY ----------------
if (this.autoPlay) {
  for (let i = this.bfNotes.length - 1; i >= 0; i--) {
    const note = this.bfNotes[i];
    if (note.hit) continue;

    const timeDiff = Math.abs(songPos - note.time);
    const laneIdx = note.lane;

    if (timeDiff <= this.hitWindowDad) {
      const anims = ["singLEFT", "singDOWN", "singUP", "singRIGHT"];
      this.boyfriend?.playAnim(anims[laneIdx], true);

      const laneState = this.laneStatesPlayer[laneIdx];
      laneState.state = "confirm";
      laneState.timer = 9;
      laneState.frameIdx = 0;

      // 🔥 HOLD
      if (note.sustain > 0) {
        const lane = this.lanesHeld[laneIdx];
        lane.held = true;          // siempre true en botplay
        lane.holdNote = note;      // empezar sustain
        note.hit = false;          // todavía NO termina
      } 
      // 🔹 NOTA NORMAL
      else {
        note.hit = true;
        this.bfNotes.splice(i, 1);
      }

      this.targetHealth = Math.min(this.playerMaxHealth, this.targetHealth + 1.25);
    }
  }
  for (let i = activeRatings.length - 1; i >= 0; i--) {
    const r = activeRatings[i];
    r.update(dt);
    if (r.dead) activeRatings.splice(i, 1);
  }
  ps.drawCamMarker(ps.camGame.ctx);
}
 updateHoldNotes(this);
  ctxHUD.restore();
}
// Dentro de tu clase PlayState
triggerEvent(name, value1, value2) {
    console.log("🔔 Evento recibido:", name, value1, value2);

    switch (name) {

        case "Play Animation": {
            const anim = value1;
            let target = value2?.toLowerCase();

            // Normalizar nombres alternativos
            if (target === "boyfriend") target = "bf";
            if (target === "girlfriend") target = "gf";
            if (target === "opponent") target = "dad";

            if (target === "bf" && this.boyfriend) this.boyfriend.playAnim(anim, true);
            else if (target === "gf" && this.girlfriend) this.girlfriend.playAnim(anim, true);
            else if (target === "dad" && this.dad) this.dad.playAnim(anim, true);
            else console.warn("⚠️ Personaje no reconocido o no disponible:", target);
        } break;

        case "Change Character":
            this.changeCharacter(value1, value2);
        break;

        case "Change Scroll Speed": {
            const speed = parseFloat(value1);
            if (!isNaN(speed)) this.scrollSpeed = speed;
        } break;

        case "Hey!": {
            if (this.boyfriend) this.boyfriend.playAnim("hey", true);
        } break;

        // ----------------------------------------
        // V-slice Zoom (multiplicador)
        case "Set V-slice Zoom": {
            const mult = parseFloat(value1);
            if (isNaN(mult)) break;

            let targetZoom = this.baseCamGameZoom * mult;

            if (value2 === "Instant") {
                this.camGameZoom = targetZoom;
                this.camGameZoomTarget = targetZoom;
            } else {
                const duration = parseFloat(value2) || 4; // default 4 si value2 es undefined
                this.camGameZoomTarget = targetZoom;
                this.zoomDuration = duration; // opcional, para usar en update()
            }
        } break;

        // Stage Zoom (cambia base)
        case "Set V-slice Stage Zoom": {
            const newBase = parseFloat(value1);
            if (isNaN(newBase)) break;

            this.baseCamGameZoom = newBase;

            if (value2 === "Instant") {
                this.camGameZoom = newBase;
                this.camGameZoomTarget = newBase;
            } else {
                const duration = parseFloat(value2) || 4;
                this.camGameZoomTarget = newBase;
                this.stageZoomDuration = duration; // opcional, para usar en update()
            }
        } break;

        default:
            console.warn("⚠️ Evento desconocido:", name, value1, value2);
    }
}

async changeCharacter(target, charName) {
  // normalizar el target
  target = target.toLowerCase();
  if (target === "boyfriend") target = "bf";
  if (target === "girlfriend") target = "gf";
  if (target === "opponent") target = "dad";

  // eliminar el viejo personaje (si existe)
  if (this[target]) {
    console.log(`🗑️ Eliminando personaje viejo: ${this[target].name}`);
    this[target].destroy?.();
  }

  // cargar el nuevo
  const { Character } = await import("../object/character.js");
  const newChar = new Character(charName);

  // set posición según target
  if (target === "bf") {
    newChar.x = this.FIXED_W * 0.7;
    newChar.y = this.FIXED_H * 0.5;
  } else if (target === "dad") {
    newChar.x = this.FIXED_W * 0.1;
    newChar.y = this.FIXED_H * 0.5;
  } else if (target === "gf") {
    newChar.x = this.FIXED_W * 0.5;
    newChar.y = this.FIXED_H * 0.3;
  }

  // asignar
  this[target] = newChar;

  console.log(`✅ Cambiado ${target} a personaje: ${charName}`);
}

openChartingEditor() {
    new CustomFadeTransition(this.game, 1.0, () => {
        // Guardar estado de la canción
const chartData = {
    songName: this.songName,
    bpm: this.songBpm,
    bfNotes: this.bfNotes,
    dadNotes: this.dadNotes,
    sections: this.sections,
    audioInstSrc: this.audioInst?.src || null,
    audioVocSrc: this.audioVoices?.src || null,
};

        // Destruir PlayState
        this.destroy();

        // Pasar chartData al editor
        this.game.changeState(new ChartingState(this, chartData));
    });
}

destroy() {
    // Pausar audio
    if (this.audioInst) { 
        this.audioInst.pause(); 
        this.audioInst = null;
    }
    if (this.boyfriendVoice) {
        this.boyfriendVoice.pause();
        this.boyfriendVoice = null;
    }
    if (this.dadVoice) {
        this.dadVoice.pause();
        this.dadVoice = null;
    }

    this.destroyed = true; // ✅ con esto ya se detiene el loop
    // ❌ no borres la función loop
    // this.loop = null;

    // Limpiar canvas
    if (this.camGame?.canvas?.parentNode) 
        this.camGame.canvas.parentNode.removeChild(this.camGame.canvas);
    if (this.camHUD?.canvas?.parentNode) 
        this.camHUD.canvas.parentNode.removeChild(this.camHUD.canvas);

    // Limpiar referencias grandes
    this.boyfriend = null;
    this.dad = null;
    this.gf = null;
    this.bfNotes = [];
    this.dadNotes = [];
    this.uiGroup = [];
}

}

// -------------------------------------------------
// Opcional: favicon silencioso para evitar 404 en dev
// -------------------------------------------------
(function ensureFavicon() {
  const link = document.querySelector('link[rel="icon"]');
  if (!link) {
    const l = document.createElement("link");
    l.rel = "icon";
    // data URI transparente 16x16
    l.href = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAHElEQVQoz2NgGAXUB8QwCqb9T0YwGJgYoAqGAgA5yQOQkQnW7wAAAABJRU5ErkJggg==";
    document.head.appendChild(l);
  }
})();
