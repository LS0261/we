// PlayState.js

import { Character } from "../object/character.js";
import Paths from "../backend/paths.js";
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
import { loadMenu } from "./playstate_helpers/loadMenu.js";
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
import { tryHitLane } from "./playstate_helpers/tryHitLane.js";
import { handleMouseTouch, handleTouches } from "./playstate_helpers/handleInputs.js";

import ChartingState from "./editors/ChartingState.js";
import CustomFadeTransition from "../backend/CustomFadeTransition.js";
import PauseMenuSubstate from "./substates/pausemenusubstate.js";

const loader = new AssetsLoader();

// ==== LUA (Fengari) ====
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;
const to_luastring = fengari.to_luastring;

export default class PlayState {
constructor(game, songName, ps) {
  this.ps = ps;
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

  this.camGame.width = width;
  this.camGame.height = height;
  this.camHUD.width = width;
  this.camHUD.height = height;

  this.gameCanvas = this.camGame.canvas;
  this.hudCanvas = this.camHUD.canvas;
  this.ctxGame = this.camGame.ctx;
  this.ctxHUD = this.camHUD.ctx;

  this.camGameZoom = 0.7;
  this.camHUDZoom = 1.0;
  this.camGameZoomTarget = this.camGameZoom;
  this.camHUDZoomTarget = this.camHUDZoom;

  this.L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(this.L);
  registerStageLuaFunctions(this.L);

  this.hitWindow = 250;
  this.autoPlay = false;

  this.keyToLane = {
    ArrowLeft: 0, KeyA: 0,
    ArrowDown: 1, KeyS: 1,
    ArrowUp: 2, KeyK: 2,
    ArrowRight: 3, KeyL: 3,
  };

  this.lanesHeld = [
    { held: false, holdNote: null },
    { held: false, holdNote: null },
    { held: false, holdNote: null },
    { held: false, holdNote: null },
  ];

  window.addEventListener("keydown", (e) => {
    const laneIdx = this.keyToLane[e.code];
    if (laneIdx !== undefined) {
      tryHitLane(this, laneIdx);
      this.lanesHeld[laneIdx].held = true;
    }
  });

  window.addEventListener("keyup", (e) => {
    const laneIdx = this.keyToLane[e.code];
    if (laneIdx !== undefined) {
      this.lanesHeld[laneIdx].held = false;
      this.lanesHeld[laneIdx].holdNote = null;
    }
  });

  this.metronome1 = new Audio(Paths.metronome1);
  this.metronome2 = new Audio(Paths.metronome2);

  this.laneStatesPlayer = Array(4).fill(0).map(() => ({ state: "idle", timer: 0, frameIdx: 0 }));
  this.laneStatesDad = Array(4).fill(0).map(() => ({ state: "idle", timer: 0, frameIdx: 0 }));

  this.calculateAccuracy = () => calculateAccuracy(this);
  this.combo = 0;
  this.laneDirs = ["left", "down", "up", "right"];
  this.score = 0;
  this.ratingsCount = { sick: 0, good: 0, bad: 0, shit: 0, miss: 0 };
  this.misses = 0;

  this.dadReceptorY = 100;
  this.bfReceptorY = this.dadReceptorY;
  this.gameZoom = 0.7;
  this.hudZoom = 1;
  this.hudZoomTarget = 1;
  this.beatLength = 60000 / 120;
  this.lastBeatTime = 0;
  this.beatCount = 0;

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
    btnAutoPlay.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.autoPlay = !this.autoPlay;
      console.log(`AutoPlay ${this.autoPlay ? "activado" : "desactivado"}`);
    });
    container.appendChild(btnAutoPlay);

    const btnChart = document.createElement('button');
    btnChart.textContent = 'Chart Editor';
    btnChart.style.padding = '10px 20px';
    btnChart.style.fontSize = '16px';
    btnChart.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.openChartingEditor();
    });
    container.appendChild(btnChart);
  };

  this.createMobileControls();
  window.addEventListener("resize", () => repositionHUD(this));

  this.camTarget = {
    x: this.FIXED_W / 2,
    y: this.FIXED_H / 2
  };

  this.initAssetsAndLoop();

  this.healthBar = new HealthBar(
    this.FIXED_W / 2 - 200,
    20,
    400,
    20,
    () => this.playerHealth,
    this.playerMaxHealth
  );
  this.healthBar.setColors("#f00", "#0f0");

  // ------------------------------
  // ✅ USAR PS PRE-CARGADO SI EXISTE
  // ------------------------------
  if (!this.ps || Object.keys(this.ps).length === 0) {
    console.warn("No se pasó ps cargado, cargando manualmente...");
    startPlay(this, this.songName).then(() => {
      this.startCountdownAndPlay();
    });
  } else {
    console.log("✅ Usando estado precargado:", this.ps);
    Object.assign(this, this.ps);
    this.startCountdownAndPlay();
  }

  if (this.game.menuMusic) {
    this.game.menuMusic.pause();
    this.game.menuMusic = null;
  }

  const scrollTime = this.scrollDuration / 1000 / this.fixedSpeed;
  
  this.pauseMenu = new PauseMenuSubstate(this);
}

startCountdownAndPlay() {
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
    this.moveCameraSection(0);
  });
}

  /*startSong(songName) {
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
      this.moveCameraSection(0);
    });
  }*/

  moveCameraSection(sec = null) {

    if (sec == null) sec = this.curSection || 0;
    if (sec < 0) sec = 0;
    
    const section = this.sections?.[sec];
    if (!section) return;

    if (this.gf && section.gfSection) {
      this.moveCameraToGirlfriend();
      return;
    }

    const isDad = section.mustHitSection != true;
    this.moveCamera(isDad);
  }


moveCameraToGirlfriend() {
  if (!this.gf) return;
  let [midX, midY] = this.gf.getMidpoint();
  this.camTarget = {
    x: midX + (this.gf.cameraPosition?.[0] || 0) + (this.girlfriendCameraOffset?.[0] || 0),
    y: midY + (this.gf.cameraPosition?.[1] || 0) + (this.girlfriendCameraOffset?.[1] || 0),
    width: 0,
    height: 0
  };
}

moveCamera(isDad) {
  if (isDad) {
    if (!this.dad) return;
    let [midX, midY] = this.dad.getMidpoint();
    this.camTarget = {
      x: midX + 150 + (this.dad.cameraPosition?.[0] || 0) + (this.opponentCameraOffset?.[0] || 0),
      y: midY - 100 + (this.dad.cameraPosition?.[1] || 0) + (this.opponentCameraOffset?.[1] || 0),
      width: 0,
      height: 0
    };
  } else {
    if (!this.boyfriend) return;
    let [midX, midY] = this.boyfriend.getMidpoint();
    this.camTarget = {
      x: midX - 100 + (this.boyfriend.cameraPosition?.[0] || 0) + (this.boyfriendCameraOffset?.[0] || 0),
      y: midY - 100 + (this.boyfriend.cameraPosition?.[1] || 0) + (this.boyfriendCameraOffset?.[1] || 0),
      width: 0,
      height: 0
    };
  }
}

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

  onSongEnd() {
    console.log("Canción terminada 🎵, regresando a Freeplay...");
    new CustomFadeTransition(this.game, 1.0, () => {
      this.destroy();
      // 👇 cambia al FreeplayState (suponiendo que exista)
      import("./FreeplayState.js").then(({ default: FreeplayState }) => {
        this.game.changeState(new FreeplayState(this.game));
      });
    });
  }

loop(timestamp) {
if (this.destroyed || this._paused) return;

  const delta = (timestamp - this.lastTimestamp) / 1000;
  this.lastTimestamp = timestamp;
  requestAnimationFrame((t) => this.loop(t));

  const ctxGame = this.ctxGame;
  const ctxHUD = this.ctxHUD;

  const songPos = this.getSongPos();

  // ---------------- GAME LAYER ----------------
  this.camGame.clear();
  this.camGame.ctx.save();

  // aplicar zoom centrado
  const zoom = this.camGameZoom;
  this.camGame.ctx.translate(this.W / 2, this.H / 2);
  this.camGame.ctx.scale(zoom, zoom);
  this.camGame.ctx.translate(-this.W / 2, -this.H / 2);

  // --- CÁMARA ---
this.updateCamera();

// mover cámara en base a camX/camY
this.camGame.ctx.translate(
  -(this.camX - this.W / 2),
  -(this.camY - this.H / 2)
);


  // --- DIBUJO ---
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

  if (this.healthBar) {
    this.healthBar.y = 630;
    this.healthBar.update();
    this.healthBar.drawTo(ctxHUD);
  }

  if (this.iconP1 && this.iconP2 && this.healthBar) {
    this.iconP1.update();
    this.iconP2.update();

    const healthPercent = this.playerHealth / this.playerMaxHealth;
    const hb = this.healthBar;

    const barX = hb.x;
    const barY = hb.y;
    const barW = hb.barWidth;
    const barH = hb.barHeight;

    this.iconP2.x = barX + (barW * (1 - healthPercent)) - this.iconP2.getFrameWidth() - 26;
    this.iconP2.y = barY + barH / 2 - this.iconP2.getFrameHeight() / 2;

    this.iconP1.x = barX + (barW * (1 - healthPercent)) + 26;
    this.iconP1.y = barY + barH / 2 - this.iconP1.getFrameHeight() / 2;

    this.iconP2.draw(ctxHUD, healthPercent, true);
    this.iconP1.draw(ctxHUD, healthPercent, false);
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

  if (!this.idleBeatCounter) this.idleBeatCounter = 0;

  if (songPos - this.lastBeatTime >= currentBeatLength - 5) {
    this.beatCount = (this.beatCount + 1) % 4;

    // --- CAMERA TARGET ---
if (this.sections) {
  for (let i = 0; i < this.sections.length; i++) {
    const sec = this.sections[i];
    const nextSec = this.sections[i + 1];
    if (songPos >= sec.startTime && (!nextSec || songPos < nextSec.startTime)) {
      if (this.curSection !== i) {        // 👈 solo si cambió de sección
        this.curSection = i;
        this.moveCameraSection(i);       // 👈 mover cámara según mustHitSection
      }
      break;
    }
  }
}

    this.camHUDZoom += 0.03; 
    this.hudZoom = 1.1;


    if (this.iconP1) this.iconP1.onBeat();
    if (this.iconP2) this.iconP2.onBeat();

if (this.songEvents?.length) {
    while (this.songEvents.length > 0 && songPos >= this.songEvents[0].time) {
        const ev = this.songEvents.shift(); // saca el primer evento
        this.runEvent(this, ev.name, ev.params);
        this.eventsPassed++;
        console.log("Evento", ev.name, "time:", ev.time, "songPos:", songPos);
    }
}

// ---------- ANIM IDLE SINCRONIZADO ----------
this.idleBeatCounter++;
if (this.idleBeatCounter >= 2) { // cada 2 beats
    // Boyfriend solo hace idle si no está en sing/miss
    if (this.boyfriend && !this.boyfriend.isAnimationPlaying(["singLEFT","singDOWN","singUP","singRIGHT","singLEFTmiss","singDOWNmiss","singUPmiss","singRIGHTmiss"])) {
        this.boyfriend.playAnim("idle", true);
    }

    // Dad igual, solo idle si no está cantando
    if (this.dad && !this.dad.isAnimationPlaying(["singLEFT","singDOWN","singUP","singRIGHT"])) {
        this.dad.playAnim("idle", true);
    }

// Cambiar zoom cada beat (como en GF)
this.camGameZoom += 0.02; 

if (this.gf) { 
  
  this.gfDanceState = (this.gfDanceState === "danceLeft") ? "danceRight" : "danceLeft"; 
  this.gf.playAnim(this.gfDanceState, true);
    this.boyfriend.playAnim(this.gfDanceState, true); 

}

    this.idleBeatCounter = 0;
}

    this.hudZoomTarget = 1;
    this.camGameZoomTarget = 0.7;
    this.camHUDZoomTarget = 1.0;

    this.lastBeatTime += currentBeatLength;
    if (songPos - this.lastBeatTime > currentBeatLength) this.lastBeatTime = songPos;
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
drawProgressBar(this, ctxHUD);

ctxHUD.save();
ctxHUD.fillStyle = 'white';
ctxHUD.font = "40px VRCFont";
ctxHUD.textAlign = 'center';
const centerX = this.W / 2;
const centerY = this.bfReceptorY + 50;
ctxHUD.fillText('BOTPLAY', centerX, centerY);
ctxHUD.restore();
  // ---------------- ELIMINAR NOTAS P1 ----------------
  for (let i = this.bfNotes.length - 1; i >= 0; i--) {
    const note = this.bfNotes[i];
    if (note.hit) continue;

    const isHold = note.sustain > 0;

const noteY = calculateNoteY(
  note.time,
  songPos,
  this.bfReceptorY,
  false,
  this.baseDistance,   // spawnY
  this.songBpm,
  this.scrollSpeed
);
if (songPos - note.time > this.hitWindow) {
// dentro del loop, cuando detectas que el jugador pasó la nota
note.hit = true;
const anims = ["singLEFTmiss", "singDOWNmiss", "singUPmiss", "singRIGHTmiss"];
ctxHUD.fillText(`Combo: ${this.combo}`, this.W / 2, hudTextY + 30);
this.misses++;
this.ratingsCount.miss++;
this.playerHealth = Math.max(0, this.playerHealth - 5);
this.boyfriend?.playAnim(anims[note.lane], true);

// Si quieres mostrar sprite de "MISS"
if (window.NotesAssets?.ratingsImages?.miss) {
  this.ratingSprites.push({
    img: window.NotesAssets.ratingsImages.miss,
    x: note.x, // posición de la nota
    y: noteY,
    vy: -1.2,
    gravity: 0.05,
    alpha: 1,
    timer: 0,
  });
}

this.bfNotes.splice(i, 1);

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

      const lane = this.laneStatesDad[note.lane];
      lane.state = "confirm";
      lane.timer = 9;
      lane.frameIdx = 0;

      this.dadNotes.splice(i, 1);
    }
  }

  // ---------------- AUTOPLAY ----------------
  if (this.autoPlay) {
    for (let i = this.bfNotes.length - 1; i >= 0; i--) {
      const note = this.bfNotes[i];
      if (note.hit) continue;

      const timeDiff = Math.abs(songPos - note.time);
      const laneIdx = note.lane;

      if (timeDiff <= this.hitWindow) {
        note.hit = true;
        const anims = ["singLEFT", "singDOWN", "singUP", "singRIGHT"];
        this.boyfriend?.playAnim(anims[laneIdx], true);

        const lane = this.laneStatesPlayer[laneIdx];
        lane.state = "confirm";
        lane.timer = 9;
        lane.frameIdx = 0;

        this.bfNotes.splice(i, 1);
        this.targetHealth = Math.min(this.playerMaxHealth, this.targetHealth + 1.25);
      }
    }
  }

  ctxHUD.restore();
}
updateCamera() {
  if (!this.camTarget) return;

  // si no existen valores iniciales
  if (this.camX === undefined) this.camX = this.camTarget.x;
  if (this.camY === undefined) this.camY = this.camTarget.y;

  const lerp = (a, b, t) => a + (b - a) * t;

  this.camX = lerp(this.camX, this.camTarget.x, 0.1);
  this.camY = lerp(this.camY, this.camTarget.y, 0.1);
}

// Dentro de tu clase PlayState
triggerEvent(name, value1, value2, strumTime) {
  console.log("🔔 Evento recibido:", name, value1, value2, strumTime);

  switch (name) {
    case "Play Animation":
      if (this.boyfriend) this.boyfriend.playAnim(value1, true);
      break;

    case "Change Scroll Speed":
      const speed = parseFloat(value1);
      if (!isNaN(speed)) this.scrollSpeed = speed;
      break;

    case "Set Camera Zoom":
      const zoom = parseFloat(value1);
      if (!isNaN(zoom)) {
        this.camGameZoomTarget = zoom;
        this.camHUDZoomTarget = zoom;
      }
      break;

    default:
      console.warn("⚠️ Evento desconocido:", name, value1, value2);
  }
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
    if (this.audioVoices) {
        this.audioVoices.pause();
        this.audioVoices = null;
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
