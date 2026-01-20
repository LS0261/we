import NotesAssets, { NotesAssetsPromise } from '../object/notes.js';
import PlayState from "./PlayState.js";
import { startPlay } from "./playstate_helpers/startPlay.js"; // Ajusta la ruta correcta

export default class LoadingState {
  constructor(game, songName) {
    this.game = game;
    this.songName = songName;

    this.container = document.getElementById("gameContainer");
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.container.appendChild(this.canvas);

    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;

    this.loadingText = "Cargando...";
    this.progress = 0;

    this.opacity = 1; // para fade out
    this.isFadingOut = false;

    this.ps = {}; // Aquí almacenaremos el estado completo precargado

    this.loadAssets();
    this.loop();
  }

  async loadAssets() {
    try {
      this.progress = 0.2;
      await NotesAssetsPromise;
      this.progress = 0.4;

      await document.fonts.load("40px VRCFont");
      this.progress = 0.5;

      // Aquí cargamos TODO el estado pesado (JSON, personajes, audios, stage...)
      await startPlay(this.ps, this.songName);
      this.progress = 1.0;

      // Esperar un poco para que se note la barra llena
      await new Promise(r => setTimeout(r, 300));

      this.startFadeOut();
    } catch (err) {
      console.error("Error cargando recursos:", err);
    }
  }

  startFadeOut() {
    this.isFadingOut = true;
  }

  finishLoading() {
    if (this._finished) return;
    this._finished = true;

    if (this.canvas.parentNode === this.container) {
      this.container.removeChild(this.canvas);
    }

    // Cambiar al PlayState pasándole el estado ya cargado
    this.game.changeState(new PlayState(this.game, this.songName, this.ps));
  }

  loop() {
    if (!this.ctx) return;
    requestAnimationFrame(() => this.loop());

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = `rgba(0,0,0,${this.opacity})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
    this.ctx.font = "30px VRCFont, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(this.loadingText, this.canvas.width / 2, this.canvas.height / 2 - 20);

    // Barra de progreso
    const barWidth = 300;
    const barHeight = 20;
    const x = (this.canvas.width - barWidth) / 2;
    const y = this.canvas.height / 2;

    this.ctx.strokeStyle = `rgba(255,255,255,${this.opacity})`;
    this.ctx.strokeRect(x, y, barWidth, barHeight);

    this.ctx.fillStyle = `rgba(0,255,0,${this.opacity})`;
    this.ctx.fillRect(x, y, barWidth * this.progress, barHeight);

    if (this.isFadingOut) {
      this.opacity -= 0.02;
      if (this.opacity <= 0) {
        this.finishLoading();
      }
    }
  }
}
