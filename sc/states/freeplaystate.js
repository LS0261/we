// sc/states/FreeplayState.js

import Paths from "../backend/Paths.js";
import MainMenuState from "./MainMenuState.js";
import CustomFadeTransition from "../backend/CustomFadeTransition.js";
import FlxSpriteJS from "../utils/FlxSpriteJS.js";
import { HealthIcon } from "../object/healthIcon.js";
import PlayState from "./PlayState.js"; // ← cuando tengas el PlayState, lo importas
import TouchControls from "../utils/TouchControls.js";

export default class FreeplayState {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = 1280;
    this.canvas.height = 720;

    this.menuDiv = document.getElementById("menu");
    this.menuDiv.innerHTML = "";

    // 🔹 TouchControls
    this.touchControls = new TouchControls(this.canvas, (action) => {
      if (this.transitioning) return;
      if (action === "up") this.changeSelection(-1);
      if (action === "down") this.changeSelection(1);
      if (action === "left") this.changeDifficulty(-1);
      if (action === "right") this.changeDifficulty(1);
      if (action === "accept") this.acceptSelection();
      if (action === "cancel") this.cancel();
    });

    // 🎵 Canciones
    this.songs = [];
    this.curSelected = 0;
    this.coolTextObjects = [];

    // Dificultades
    this.difficulties = ["EASY", "NORMAL", "HARD"];
    this.curDifficulty = 1; // NORMAL por defecto

    this.ready = false;
    this.transitioning = false;
    this.lastTimestamp = performance.now();
    this.bg = null;

    // 🎨 transición de color
    this.bgColor = [0, 0, 0];
    this.intendedColor = [0, 0, 0];
    this.colorLerpSpeed = 5.0;

    // Viewport lista canciones
    this.listViewport = {
      x: this.canvas.width - 620, // lado derecho
      y: 140,
      width: 560,
      height: 420,
      itemHeight: 90
    };

    this.confirmAnimation = {
      active: false,
      progress: 0,
      duration: 0.4
    };

    this.scrollY = 0;
    this.targetScrollY = 0;

    this.rafId = null;
    this.gridOffset = 0;

    this.init();
  }

async init() {
  // --- Fondo ---
  this.bg = new FlxSpriteJS(-80, 0);
  await this.bg.loadGraphic(Paths.image("menuBG"));
  this.bg.antialiasing = true;
  this.bg.setGraphicSize(this.bg.width * 1.175);
  this.bg.updateHitbox();
  this.bg.screenCenter();

  this.songs = [];

  // --- Leer weekList.txt ---
  let weekNames = [];
  try {
    const txt = await fetch(Paths.file("data/weekList.txt"))
      .then(r => r.text());

    weekNames = txt
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0);
  } catch (e) {
    console.error("No se pudo cargar weekList.txt:", e);
  }

  // --- Cargar cada week ---
  for (let weekIndex = 0; weekIndex < weekNames.length; weekIndex++) {
    const weekName = weekNames[weekIndex];

    try {
      const week = await fetch(
        Paths.file(`data/weeks/${weekName}.json`)
      ).then(r => r.json());

      for (let song of week.songs) {
        this.songs.push({
          name: song[0],
          icon: new HealthIcon(song[1]),
          week: weekIndex,
          color: song[2] || [0, 0, 0]
        });
      }

    } catch (e) {
      console.error(`No se pudo cargar ${weekName}.json:`, e);
    }
  }

  await this.touchControls.initButtons();
  console.log("Canciones cargadas en Freeplay:", this.songs.map(s => s.name));

  // Color inicial
  if (this.songs.length > 0) {
    this.bgColor = this.songs[this.curSelected].color.slice();
    this.intendedColor = this.bgColor.slice();
  }

  this.generateSongList();
  this.bindInput();

  // Fake score y accuracy
  this.songs.forEach((song, i) => {
    song.fakeScore = 900000 + i * 1234;
    song.fakeAccuracy = (97 + (i % 5) * 0.5).toFixed(2);
  });

  this.ready = true;
  this.rafId = requestAnimationFrame((t) => this.loop(t));
}

  generateSongList() {
    this.coolTextObjects = [];
    let startY = 200;

    for (let i = 0; i < this.songs.length; i++) {
      this.coolTextObjects.push({
        song: this.songs[i],
        x: this.listViewport.x + 20,
        y: startY + i * 60
      });
    }
  }

  bindInput() {
    this._keydownHandler = (e) => {
      if (this.transitioning) return;

      if (e.key === "ArrowUp") this.changeSelection(-1);
      if (e.key === "ArrowDown") this.changeSelection(1);
      if (e.key === "ArrowLeft") this.changeDifficulty(-1);
      if (e.key === "ArrowRight") this.changeDifficulty(1);
      if (e.key === "Enter") this.acceptSelection();
      if (e.key === "Escape") this.cancel();
    };
    window.addEventListener("keydown", this._keydownHandler);
  }

  changeSelection(change) {
    this.curSelected += change;
    if (this.curSelected < 0) this.curSelected = this.songs.length - 1;
    if (this.curSelected >= this.songs.length) this.curSelected = 0;

    this.targetScrollY = this.curSelected * this.listViewport.itemHeight;

    this.intendedColor = this.songs[this.curSelected].color.slice();

    const audio = new Audio(Paths.sound("scrollMenu"));
    audio.play();
  }

  changeDifficulty(change) {
    this.curDifficulty += change;
    if (this.curDifficulty < 0) this.curDifficulty = this.difficulties.length - 1;
    if (this.curDifficulty >= this.difficulties.length) this.curDifficulty = 0;

    const audio = new Audio(Paths.sound("scrollMenu"));
    audio.play();
  }

  acceptSelection() {
    if (this.transitioning) return;
    this.transitioning = true;

    this.confirmAnimation.active = true;
    this.confirmAnimation.progress = 0;

    const song = this.songs[this.curSelected];
    console.log("Seleccionaste canción:", song.name, "Dificultad:", this.difficulties[this.curDifficulty]);

    const audio = new Audio(Paths.sound("confirmMenu"));
    audio.play();

    setTimeout(() => {
      new CustomFadeTransition(this.game, 1.0, () => {
        this.game.changeState(
          new PlayState(this.game, song.name, this.difficulties[this.curDifficulty])
        );
      });
    }, this.confirmAnimation.duration * 1000);
  }

  cancel() {
    if (this.transitioning) return;
    this.transitioning = true;

    const audio = new Audio(Paths.sound("cancelMenu"));
    audio.play();

    new CustomFadeTransition(this.game, 1.0, () => {
      this.game.changeState(new MainMenuState(this.game));
    });
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  update(delta) {
    for (let i = 0; i < 3; i++) {
      this.bgColor[i] = this.lerp(this.bgColor[i], this.intendedColor[i], delta * this.colorLerpSpeed);
    }

    this.gridOffset += delta * 50;
    if (this.gridOffset > 40) this.gridOffset -= 40;

    this.scrollY += (this.targetScrollY - this.scrollY) * delta * 10;

    if (this.confirmAnimation.active) {
      this.confirmAnimation.progress += delta / this.confirmAnimation.duration;
      if (this.confirmAnimation.progress > 1) {
        this.confirmAnimation.progress = 1;
      }
    }
  }

  drawGridBackdrop(ctx) {
    const { x, y, width, height } = this.listViewport;
    const gridSize = 40;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let gx = x - this.gridOffset; gx < x + width; gx += gridSize) {
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + height);
    }
    for (let gy = y - this.gridOffset; gy < y + height; gy += gridSize) {
      ctx.moveTo(x, gy);
      ctx.lineTo(x + width, gy);
    }
    ctx.stroke();
    ctx.restore();
  }

  draw() {
    if (!this.ready) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.bg.draw(ctx);
    this.touchControls?.draw();

    // Overlay color
    ctx.fillStyle = `rgba(${this.bgColor[0]}, ${this.bgColor[1]}, ${this.bgColor[2]}, 0.4)`; 
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid backdrop
    this.drawGridBackdrop(ctx);

    // Borde viewport
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 4;
    ctx.strokeRect(this.listViewport.x, this.listViewport.y, this.listViewport.width, this.listViewport.height);

    // --- DIFICULTAD ---
    ctx.font = "32px 'VRCFont'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const diffX = this.listViewport.x + this.listViewport.width / 2;
    const diffY = this.listViewport.y - 40;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(diffX - 140, diffY - 22, 280, 44);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(diffX - 140, diffY - 22, 280, 44);

    ctx.fillStyle = "yellow";
    ctx.fillText(`< ${this.difficulties[this.curDifficulty]} >`, diffX, diffY);

    // --- LISTA CANCIONES ---
    ctx.font = "36px 'VRCFont'";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const firstVisibleIndex = Math.floor(this.scrollY / this.listViewport.itemHeight);
    const itemsVisibleCount = Math.ceil(this.listViewport.height / this.listViewport.itemHeight) + 1;

    for (let i = firstVisibleIndex; i < firstVisibleIndex + itemsVisibleCount; i++) {
      if (i < 0 || i >= this.songs.length) continue;
      const song = this.songs[i];
      const baseY = this.listViewport.y + (i * this.listViewport.itemHeight) - this.scrollY + this.listViewport.itemHeight / 2;

      let scale = 1;
      let glowAlpha = 0;

      if (this.confirmAnimation.active && i === this.curSelected) {
        const p = this.confirmAnimation.progress;
        scale = 1 + 0.2 * Math.sin(p * Math.PI);
        glowAlpha = 0.8 * Math.sin(p * Math.PI);
      }

      const y = baseY;

      ctx.save();
      ctx.translate(this.listViewport.x + 20, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = (i === this.curSelected) ? `rgba(255,255,0,1)` : "white";
      ctx.fillText(song.name, 0, 0);
      if (glowAlpha > 0) {
        ctx.shadowColor = `rgba(255, 255, 0, ${glowAlpha})`;
        ctx.shadowBlur = 20;
        ctx.fillText(song.name, 0, 0);
      }
      ctx.restore();

      // Icono
      ctx.save();
      const iconX = this.listViewport.x + this.listViewport.width - 60;
      ctx.translate(iconX, y - 30);
      ctx.scale(scale, scale);
      song.icon.alpha = (i === this.curSelected) ? 1 : 0.7;
      song.icon.visible = true;
      song.icon.draw(ctx, 0.5, false);
      ctx.restore();

      // Score y accuracy
      ctx.textAlign = "right";
      ctx.fillStyle = (i === this.curSelected) ? "yellow" : "white";
      ctx.fillText(`Score: ${song.fakeScore}`, iconX - 20, y - 10);
      ctx.fillText(`Accuraty: ${song.fakeAccuracy}%`, iconX - 20, y + 20);
      ctx.textAlign = "left";
    }
  }

  loop(timestamp) {
    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this.update(delta);
    this.draw();

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  destroy() {
    console.log("Destruyendo FreeplayState...");
    if (this.songs) {
      for (let s of this.songs) s.icon?.destroy?.();
      this.songs = [];
    }
    this.coolTextObjects = [];
    this.bg?.destroy?.();
    this.bg = null;

    this.touchControls?.destroy();
    this.touchControls = null;

    if (this._keydownHandler) {
      window.removeEventListener("keydown", this._keydownHandler);
      this._keydownHandler = null;
    }

    this.ctx = null;
    this.canvas = null;

    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;

    this.ready = false;
    this.transitioning = false;
  }
}
