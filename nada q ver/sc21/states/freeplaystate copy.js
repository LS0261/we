// sc/states/FreeplayState.js

import Paths from "../backend/Paths.js";
import MainMenuState from "./MainMenuState.js";
import CustomFadeTransition from "../backend/CustomFadeTransition.js";
import FlxSpriteJS from "../utils/FlxSpriteJS.js";
import { HealthIcon } from "../object/healthIcon.js";
import PlayState from "./PlayState.js"; // ← cuando tengas el PlayState, lo importas
import TouchControls from "../utils/TouchControls.js";
import LoadingState from "./LoadingState.js"; // ✅

export default class FreeplayState {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = 1280;
    this.canvas.height = 720;

    this.menuDiv = document.getElementById("menu");
    this.menuDiv.innerHTML = "";

this.touchControls = new TouchControls(this.canvas, (action) => {
  if (this.transitioning) return;
  if (action === "up") this.changeSelection(-1);
  if (action === "down") this.changeSelection(1);
  if (action === "accept") this.acceptSelection();
  if (action === "cancel") this.cancel();
});

    this.songs = [];
    this.curSelected = 0;
    this.coolTextObjects = [];

    this.ready = false;
    this.transitioning = false;

    this.lastTimestamp = performance.now();

    this.bg = null;

    // 🎨 transición suave de colores
    this.bgColor = [0, 0, 0];        // color actual (RGB)
    this.intendedColor = [0, 0, 0];  // color objetivo (RGB)
    this.colorLerpSpeed = 5.0;       // velocidad de transición

    // id del requestAnimationFrame
    this.rafId = null;

    this.init();
  }

  async init() {
    // --- Fondo base ---
    this.bg = new FlxSpriteJS(-80, 0);
    await this.bg.loadGraphic(Paths.image("menuBG"));
    this.bg.antialiasing = true;
    this.bg.setGraphicSize(this.bg.width * 1.175);
    this.bg.updateHitbox();
    this.bg.screenCenter();

    // cargar lista de weeks desde JSON
    const list = await fetch(Paths.file("data/weeks/weekList.json"))
      .then(r => r.json())
      .catch(e => {
        console.error("No se pudo cargar weekList.json:", e);
        return { weeks: [] };
      });

    // recolectar canciones con su icono y color
    this.songs = [];
    for (let weekIndex = 0; weekIndex < list.weeks.length; weekIndex++) {
      const week = list.weeks[weekIndex];
      for (let song of week.songs) {
        this.songs.push({
          name: song[0],                  // nombre
          icon: new HealthIcon(song[1]),  // icono
          week: weekIndex,
          color: song[2] || [0, 0, 0]     // color [r,g,b]
        });
      }
    }
await this.touchControls.initButtons(); // ← ¡sin esto no se dibujan los botones!
    console.log("Canciones cargadas en Freeplay:", this.songs.map(s => s.name));

    // color inicial del primer item
    if (this.songs.length > 0) {
      this.bgColor = this.songs[this.curSelected].color.slice();
      this.intendedColor = this.bgColor.slice();
    }

    this.generateSongList();
    this.bindInput();

    this.ready = true;
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  generateSongList() {
    this.coolTextObjects = [];
    let startY = 200;

    for (let i = 0; i < this.songs.length; i++) {
      this.coolTextObjects.push({
        song: this.songs[i],
        x: this.canvas.width / 2,
        y: startY + i * 60
      });
    }
  }

bindInput() {
  // guardamos referencias para poder quitarlas luego
  this._keydownHandler = (e) => {
    if (this.transitioning) return;

    if (e.key === "ArrowUp") this.changeSelection(-1);
    if (e.key === "ArrowDown") this.changeSelection(1);

    if (e.key === "Enter") this.acceptSelection();
    if (e.key === "Escape") this.cancel();
  };

  window.addEventListener("keydown", this._keydownHandler);
}


  changeSelection(change) {
    this.curSelected += change;
    if (this.curSelected < 0) this.curSelected = this.songs.length - 1;
    if (this.curSelected >= this.songs.length) this.curSelected = 0;

    // cambiar color suavemente al de la canción seleccionada
    const song = this.songs[this.curSelected];
    this.intendedColor = song.color.slice();

    const audio = new Audio(Paths.sound("scrollMenu"));
    audio.play();
  }

acceptSelection() {
  if (this.transitioning) return;
  this.transitioning = true;

  const song = this.songs[this.curSelected];
  console.log("Seleccionaste canción:", song.name);

  const audio = new Audio(Paths.sound("confirmMenu"));
  audio.play();

  new CustomFadeTransition(this.game, 1.0, () => {
    this.game.changeState(new LoadingState(this.game, song.name));
  });
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

  // 🔹 función de interpolación
  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  update(delta) {
    // transición suave de color
    for (let i = 0; i < 3; i++) {
      this.bgColor[i] = this.lerp(this.bgColor[i], this.intendedColor[i], delta * this.colorLerpSpeed);
    }
  }

  draw() {
    if (!this.ready) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fondo base (imagen)
    this.bg.draw(ctx);

this.touchControls?.draw();

    // Overlay de color (suave)
    ctx.fillStyle = `rgba(${this.bgColor[0]}, ${this.bgColor[1]}, ${this.bgColor[2]}, 0.4)`; 
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Lista de canciones + icono
    ctx.font = "40px 'VRCFont";
    ctx.textAlign = "left";

    for (let i = 0; i < this.coolTextObjects.length; i++) {
      const item = this.coolTextObjects[i];
      const { song, x, y } = item;

      ctx.fillStyle = i === this.curSelected ? "yellow" : "white";

      // dibujar icono
      song.icon.x = x - 200;
      song.icon.y = y - 30;
      song.icon.alpha = 1;
      song.icon.visible = true;
      song.icon.draw(ctx, 0.5, false);

      // nombre de la canción
      ctx.fillText(song.name, x - 120, y + 10);
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

  // Limpiar lista de canciones
  if (this.songs) {
    for (let s of this.songs) {
      if (s.icon) {
        s.icon.destroy?.();  // si tu HealthIcon tiene destroy
      }
    }
    this.songs = [];
  }

  // Limpiar lista de objetos visuales
  this.coolTextObjects = [];

  // Limpiar fondo
  if (this.bg) {
    this.bg.destroy?.();   // si FlxSpriteJS tiene destroy
    this.bg = null;
  }

this.touchControls?.destroy();
this.touchControls = null;

  // Quitar event listeners
  if (this._keydownHandler) {
    window.removeEventListener("keydown", this._keydownHandler);
    this._keydownHandler = null;
  }

  // Reset canvas / context
  this.ctx = null;
  this.canvas = null;

  // Detener loop
  if (this.rafId) {
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  // Reset estado
  this.ready = false;
  this.transitioning = false;
}

}
