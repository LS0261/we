// PlayState.js

import { Character } from "../../object/character.js";
import Paths from "../../backend/paths.js";
import Bar from "../../object/bar.js";
import HealthIcon from "../../object/healthIcon.js";
import ClientPrefs from "../../backend/clientPrefs.js";
import { registerStageLuaFunctions } from "../../luabridge/stageBridge.js";
import { Camera } from "../camera.js";
import AssetsLoader from "../../backend/assetsLoader.js";
import NotesAssets, { NotesAssetsPromise } from '../../object/notes.js';
import HealthBar from "../../object/healthBar.js";

import { loadJSON } from "../playstate_helpers/loadJSON.js";
import { setupButtons } from "../playstate_helpers/setupButtons.js";
import { loadMenu } from "../playstate_helpers/loadMenu.js";
import { startCountdown } from "../playstate_helpers/countdown.js";
import { startPlay } from "../playstate_helpers/startPlay.js";
import { runEvent } from "../playstate_helpers/runEvent.js";
import { repositionHUD } from "../playstate_helpers/repositionHUD.js";
import { bindInputs } from "../playstate_helpers/bindInputs.js";
import { addRatingSprite } from "../playstate_helpers/addRatingSprite.js";
import { drawProgressBar } from "../playstate_helpers/drawProgressBar.js";
import { calculateNoteY } from "../playstate_helpers/calculateNoteY.js";
import { updateHealthIcons } from "../playstate_helpers/updateHealthIcons.js";
import { drawStrumline } from "../playstate_helpers/drawStrumline.js"
import { calculateAccuracy } from "../playstate_helpers/calculateAccuracy.js"
import { renderStrums } from "../playstate_helpers/renderStrums.js";
import { renderNotes } from "../playstate_helpers/renderNotes.js";
import { tryHitLane } from "../playstate_helpers/tryHitLane.js";
import { handleMouseTouch, handleTouches } from "../playstate_helpers/handleInputs.js";

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
    
    this.clientPrefs = new ClientPrefs();
    this.clientPrefs.loadPrefs();

    this.FIXED_W = 1280;
    this.FIXED_H = 720;
    this.container = document.getElementById("gameContainer");
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
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

// actualizar también dentro de la cámara
this.camGame.width = width;
this.camGame.height = height;
this.camHUD.width = width;
this.camHUD.height = height;

this.gameCanvas = this.camGame.canvas;
this.hudCanvas = this.camHUD.canvas;
this.ctxGame = this.camGame.ctx;
this.ctxHUD = this.camHUD.ctx;

this.camGameZoom = 0.7;       // zoom base del juego
this.camHUDZoom = 1.0;        // zoom base del HUD
this.camGameZoomTarget = this.camGameZoom;
this.camHUDZoomTarget = this.camHUDZoom;

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
    this.scrollDuration = 100;
    this.anticipationMs = 0;
    this.lastTimestamp = 0;
    this.audioInst = null;
    this.playing = false;

    this.playerHealth = 50;
    this.targetHealth = 1;
    this.playerMaxHealth = 100;

    this.iconP1 = null;
    this.iconP2 = null;

    // Personajes
    this.boyfriend = null;
    this.gf = null;
    this.dad = null;

    // INPUT / lanes
    this.hitWindow = 250; // ms

    this.autoPlay = false;

    this.keyToLane = {
      ArrowLeft: 0,
      KeyA: 0,
      ArrowDown: 1,
      KeyS: 1,
      ArrowUp: 2,
      KeyK: 2,
      ArrowRight: 3,
      KeyL: 3,
    };
    
    this.lanesHeld = [
      { held: false, holdNote: null },
      { held: false, holdNote: null },
      { held: false, holdNote: null },
      { held: false, holdNote: null },
    ];

    this.metronome1 = new Audio(Paths.metronome1);
    this.metronome2 = new Audio(Paths.metronome2);

    this.laneStates = [
      { state: "idle", timer: 0, frameIdx: 0 },
      { state: "idle", timer: 0, frameIdx: 0 },
      { state: "idle", timer: 0, frameIdx: 0 },
      { state: "idle", timer: 0, frameIdx: 0 },
    ];

    this.laneDirs = ["left", "down", "up", "right"];
    this.score = 0;
    this.ratingsCount = { sick: 0, good: 0, bad: 0, shit: 0, miss: 0 };
    this.misses = 0;

    this.dadReceptorY = 100;
    this.bfReceptorY = this.dadReceptorY;
    this.baseDistance = this.bfReceptorY + 200; // o altura de pantalla - receptorY


    this.gameZoom = 0.7;
    //this.ctxGame.scale(this.gameZoom, this.gameZoom);
    // HUD zoom + metrónomo
    this.hudZoom = 1;
    this.hudZoomTarget = 1;
    this.beatLength = 60000 / 120;
    this.lastBeatTime = 0;
    this.beatCount = 0;
    
    // Helpers que manejan UI, menú, inputs, etc.
    setupButtons(this);
    bindInputs(this);
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyB") {
    this.autoPlay = !this.autoPlay;
    console.log(`AutoPlay ${this.autoPlay ? "activado" : "desactivado"}`);
  }
});

    window.addEventListener("resize", () => repositionHUD(this));

    this.camTarget = { pos: [this.FIXED_W/2, this.FIXED_H/2] };

    // iniciar bucle u otra lógica principal
    // Por ejemplo:
    this.lastTimestamp = performance.now();
    requestAnimationFrame((t) => this.loop?.(t));
    this.initAssetsAndLoop();

    if (this.songName) {
      this.startSong(this.songName);
    }
  if (this.game.menuMusic) {
    this.game.menuMusic.pause();
    this.game.menuMusic = null;
  }
const scrollTime = this.scrollDuration / 1000 / this.fixedSpeed; // en segundos
    //this.calculateNoteY = calculateNoteY;
/*this.calculateNoteY = (note, songPos, receptorY, upwards) => {
    const timeLeft = (note.time - songPos) / 1000; // segundos
    const scrollTime = this.scrollDuration / 1000 / this.fixedSpeed;
    const ratio = Math.max(0, Math.min(1, timeLeft / scrollTime)); // ratio 0-1
    const totalDistance = this.baseDistance;

    return upwards 
        ? receptorY + totalDistance * ratio 
        : receptorY - totalDistance * ratio;
};*/

this.healthBar = new HealthBar(
  this.FIXED_W / 2 - 200,  // x
  20,                       // y
  400,                      // ancho
  20,                       // alto
  () => this.playerHealth,  // función que devuelve la salud actual
  this.playerMaxHealth       // salud máxima
);
this.healthBar.setColors("#f00", "#0f0");
  }
async initAssetsAndLoop() {
    try {
        await NotesAssetsPromise; // espera a que se cargue XML + imágenes
        console.log("NotesAssets cargado ✅, iniciando loop");
        
        // Ahora sí se puede iniciar el loop
        this.lastTimestamp = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    } catch (err) {
        console.error("Error cargando NotesAssets:", err);
    }
}
startSong(songName) {
  // Carga normal de assets
  startPlay(this, songName);

startCountdown(this, () => {
  if (this.audioInst) {
    this.audioInst.currentTime = 0;
    this.audioInst.play();
  }
  if (this.audioVoices) {
    this.audioVoices.currentTime = 0;
    this.audioVoices.play();
  }

  this.playing = true;
});

}

  startMenu() {
    // delega a helper
    loadMenu(this);
  }
getSongPos() {
  if (!this.audioInst) return 0;
  return this.audioInst.currentTime * 1000 + this.anticipationMs;
}

  runEvent(name, params) {
    runEvent(this, name, params);
  }

  repositionHUD() {
    repositionHUD(this);
  }
loop(timestamp) {
    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    requestAnimationFrame((t) => this.loop(t));

    const ctxGame = this.ctxGame;
    const ctxHUD = this.ctxHUD;

    const songPos = this.getSongPos();

// ---------------- GAME LAYER ----------------
this.camGame.clear();
this.camGame.ctx.save();

// aplicar zoom bien centrado en el canvas
const zoom = this.camGameZoom;
this.camGame.ctx.translate(this.W / 2, this.H / 2);
this.camGame.ctx.scale(zoom, zoom);
this.camGame.ctx.translate(-this.W / 2, -this.H / 2);

if (this.camTarget?.pos) {
    this.camGame.follow(this.camTarget.pos[0], this.camTarget.pos[1]);
} else {
    this.camGame.follow(this.W, this.H);
}

this.camGame.begin();
if (this.stage?.draw) this.stage.draw(this.camGame.ctx);

this.boyfriend?.update(delta);
this.dad?.update(delta);
this.gf?.update(delta);

this.gf?.draw(this.camGame.ctx);
this.dad?.draw(this.camGame.ctx);
this.boyfriend?.draw(this.camGame.ctx);

this.camGame.end();
this.camGame.ctx.restore();

    // ---------------- HUD LAYER ----------------
ctxHUD.setTransform(1, 0, 0, 1, 0, 0);
ctxHUD.clearRect(0, 0, this.hudCanvas.width, this.hudCanvas.height);

ctxHUD.save();
const hudZoom = this.camHUDZoom;
ctxHUD.translate(this.W / 2, this.H / 2);
ctxHUD.scale(hudZoom, hudZoom);
ctxHUD.translate(-this.W / 2, -this.H / 2);

    if (this.healthBar) {
        this.healthBar.update();
        this.healthBar.drawTo(ctxHUD);
    }

if (this.iconP1 && this.iconP2 && this.healthBar) {
    const healthPercent = this.playerHealth / this.playerMaxHealth;
    const hb = this.healthBar;

    const barX = hb.x;
    const barY = hb.y;
    const barW = hb.barWidth;
    const barH = hb.barHeight;

    // --- OPPONENT (izquierda de la barra) ---
    this.iconP2.x = barX + (barW * (1 - healthPercent)) - this.iconP2.getFrameWidth() - 26;
    this.iconP2.y = barY + barH / 2 - this.iconP2.getFrameHeight() / 2;

    // --- PLAYER (derecha de la barra) ---
    this.iconP1.x = barX + (barW * (1 - healthPercent)) + 26;
    this.iconP1.y = barY + barH / 2 - this.iconP1.getFrameHeight() / 2;

    // --- DIBUJO ---
    this.iconP2.draw(ctxHUD, healthPercent, true);   // Opponent
    this.iconP1.draw(ctxHUD, healthPercent, false);  // Player
}

    const strumSpacing = Math.min(this.W * 0.08, 100);
    const strumSize = strumSpacing;
    const holdWidth = strumSize * 0.4;
    const startX_opp = this.W * 0.1;
    const startX_player = this.W - strumSpacing * 4 - this.W * 0.1;

    renderStrums(this, ctxHUD, this.dadReceptorY, strumSize, startX_opp, strumSpacing, this.laneStates, false, delta);
    renderNotes(this, ctxHUD, this.dadNotes, false, startX_opp, strumSpacing, strumSize, holdWidth, this.dadReceptorY, songPos, true);

    renderStrums(this, ctxHUD, this.bfReceptorY, strumSize, startX_player, strumSpacing, this.laneStates, true, delta);
    renderNotes(this, ctxHUD, this.bfNotes, true, startX_player, strumSpacing, strumSize, holdWidth, this.bfReceptorY, songPos, true);

    ctxHUD.fillStyle = "#fff";
    ctxHUD.font = "20px Arial";
    const hudTextY = (this.healthBar?.y || 50) + (this.healthBar?.barHeight || 20) + 30;
    const accuracy = this.calculateAccuracy?.() || 0;
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

    if (songPos - this.lastBeatTime >= currentBeatLength - 5) {
        this.beatCount = (this.beatCount + 1) % 4;
        
    this.camGameZoom += 0.03; 
    this.camHUDZoom += 0.02; 
    this.hudZoom = 1.1;

        if (this.iconP1) this.iconP1.onBeat();
        if (this.iconP2) this.iconP2.onBeat();

        this.boyfriend?.onBeat();
        this.dad?.onBeat();
        this.gf?.onBeat();

        this.hudZoomTarget = 1;
        this.camGameZoomTarget = 0.7;
        this.camHUDZoomTarget = 1.0;

        this.lastBeatTime += currentBeatLength;
        if (songPos - this.lastBeatTime > currentBeatLength) this.lastBeatTime = songPos;
    }

const defaultGameZoom = 0.7;
const defaultHUDZoom = 1.0;

this.camGameZoom += (defaultGameZoom - this.camGameZoom) * 0.1;
this.camHUDZoom += (defaultHUDZoom - this.camHUDZoom) * 0.1;
this.hudZoom += (1 - this.hudZoom) * 0.1;

(window.__CHAR_INSTANCES || []).forEach(c => {
  if (c !== ps.boyfriend && c.isPlayer && c.name === ps.boyfriend.name) {
    console.log("Eliminando clon BF", c);
    // Opcional: c.destroy(); si tienes destroy
  }
});
    // ---------------- VIDA ----------------
    const smoothSpeed = 3;
    this.playerHealth += (this.targetHealth - this.playerHealth) * smoothSpeed * delta;
    if (Math.abs(this.targetHealth - this.playerHealth) < 0.001) this.playerHealth = this.targetHealth;

    // ---------------- HOLD NOTES ----------------
    for (let i = 0; i < 4; i++) {
        const lane = this.lanesHeld[i];
        if (lane.held && lane.holdNote) {
            const note = lane.holdNote;
            if (songPos > note.time + note.sustain + 100) {
                const idx = this.bfNotes.indexOf(note);
                if (idx !== -1) this.bfNotes.splice(idx, 1);
                this.score += 50;
                this.notesPassed++;
                addRatingSprite(30);
                lane.held = false;
                lane.holdNote = null;
            }
        }
    }

    // ---------------- ELIMINAR NOTAS P1 ----------------
for (let i = this.bfNotes.length - 1; i >= 0; i--) {
    const note = this.bfNotes[i];
    if (note.hit) continue;

    const isHold = note.sustain > 0;
    const noteY = calculateNoteY(note, songPos, this.bfReceptorY, true, 400, 2000);


    // Desaparece solo si está fuera de la pantalla
    if (noteY < -50 || noteY > this.H + 50) { 
        const laneIdx = note.lane - 4;
        const isBeingHeld = this.lanesHeld[laneIdx]?.holdNote === note;

        // Si es hold y se está sosteniendo, no lo borramos
        if (isHold && isBeingHeld) continue;

        this.bfNotes.splice(i, 1);

        // Solo penalizamos si NO es hold o si no se estaba sosteniendo
        if (!isHold || !isBeingHeld) {
            this.misses++;
            this.targetHealth = Math.max(0, this.targetHealth - 0.5);
        }
    }
}

    // ---------------- NOTAS DAD ----------------
    for (let i = this.dadNotes.length - 1; i >= 0; i--) {
        const note = this.dadNotes[i];
        if (note.hit) continue;
        if (songPos >= note.time - this.hitWindow && songPos <= note.time + this.hitWindow) {
            note.hit = true;
            const anims = ["singLEFT", "singDOWN", "singUP", "singRIGHT"];
            this.dad?.playAnim(anims[note.lane], true);
            this.dadNotes.splice(i, 1);
        }
    }

    // ---------------- AUTOPLAY ----------------
    if (this.autoPlay) {
        for (let i = this.bfNotes.length - 1; i >= 0; i--) {
            const note = this.bfNotes[i];
            if (note.hit) continue;

            const timeDiff = Math.abs(songPos - note.time);
            const laneIdx = note.lane - 4;

            if (timeDiff <= this.hitWindow) {
                note.hit = true;
                const anims = ["singLEFT", "singDOWN", "singUP", "singRIGHT"];
                this.boyfriend?.playAnim(anims[laneIdx], true);
                this.bfNotes.splice(i, 1);
                this.targetHealth = Math.min(this.playerMaxHealth, this.targetHealth + 1.25);
            }
        }
    }

    ctxHUD.restore();
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
