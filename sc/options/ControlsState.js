// sc/states/ControlsState.js
import MusicBeatState from "../backend/MusicBeatState.js";
import Paths from "../backend/Paths.js";
import CustomFadeTransition from "../backend/CustomFadeTransition.js";
import OptionsState from "./OptionsState.js";

export default class ControlsState extends MusicBeatState {
  constructor(game) {
    super();
    this.game = game;

    // Asegúrate de tener clientPrefs cargado
    if (!this.game.clientPrefs) {
      throw new Error("game.clientPrefs no definido en ControlsState");
    }

    this.keyBinds = this.game.clientPrefs.keyBinds; // referencia directa
    this.keysList = Object.keys(this.keyBinds); // orden de las opciones
    this.curSelected = 0;

    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");

    this.scrollSpeed = 0.15;
    this.camY = 0;
    this.camTargetY = 0;

    this.lastTimestamp = performance.now();
    this.loopId = null;

    this.init();
  }

  async init() {
    // Fondo
    this.bg = new Image();
    this.bg.src = Paths.image('menuDesat');
    await new Promise(res => this.bg.onload = res);

    // Opciones
    this.optionObjects = [];
    const spacing = 60;
    for (let i = 0; i < this.keysList.length; i++) {
      const opt = {
        text: this.keysList[i],
        x: this.canvas.width / 2,
        y: this.canvas.height / 2 + (spacing * (i - this.keysList.length / 2)) + 30,
        alpha: 1
      };
      this.optionObjects.push(opt);
    }

    // Listeners
    this.handleInputBound = (e) => this.handleInput(e);
    window.addEventListener("keydown", this.handleInputBound);

    // Loop
    this.loopId = requestAnimationFrame((t) => this.loop(t));
  }

  handleInput(e) {
    if (e.key === "ArrowUp") this.changeSelection(-1);
    if (e.key === "ArrowDown") this.changeSelection(1);
    if (e.key === "Escape") this.closeControls();
    if (e.key === "Enter") this.startRemapKey();
  }

  changeSelection(change = 0) {
    this.curSelected = (this.curSelected + change + this.keysList.length) % this.keysList.length;
    // efecto de sonido opcional
    const audio = new Audio(Paths.sound('scrollMenu'));
    audio.volume = 0.7;
    audio.play();
  }

  startRemapKey() {
    const keyName = this.keysList[this.curSelected];
    alert(`Presiona la nueva tecla para: ${keyName}`);
    
    const keyListener = (e) => {
      this.keyBinds[keyName] = [e.code]; // reemplaza la tecla
      this.game.clientPrefs.saveSettings(); // guarda inmediatamente
      window.removeEventListener("keydown", keyListener);
    };

    window.addEventListener("keydown", keyListener);
  }

  closeControls() {
    const gameRef = this.game;
    new CustomFadeTransition(gameRef, 1.0, () => {
      this.destroy();
      gameRef.changeState(new OptionsState(gameRef));
    });
  }

  loop(timestamp) {
    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    // Scroll cámara
    const selectedItem = this.optionObjects[this.curSelected];
    this.camTargetY = selectedItem.y - this.canvas.height / 2;
    this.camY += (this.camTargetY - this.camY) * this.scrollSpeed;

    // Dibujar fondo
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.bg, 0, 0, this.canvas.width, this.canvas.height);

    // Dibujar opciones y teclas asignadas
    this.ctx.font = "28px 'VRCFont'";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    for (let i = 0; i < this.optionObjects.length; i++) {
      const item = this.optionObjects[i];
      const y = item.y - this.camY;

      item.alpha = (i === this.curSelected) ? 1 : 0.6;
      this.ctx.globalAlpha = item.alpha;

      // Nombre de la acción
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.fillText(item.text, item.x - 100, y);

      // Tecla asignada
      this.ctx.fillText(this.keyBinds[item.text][0], item.x + 100, y);

      // Selectores
      if (i === this.curSelected) {
        this.ctx.fillText(">", item.x - 200, y);
        this.ctx.fillText("<", item.x + 200, y);
      }
    }
    this.ctx.globalAlpha = 1;

    this.loopId = requestAnimationFrame((t) => this.loop(t));
  }

  destroy() {
    if (this.loopId) cancelAnimationFrame(this.loopId);
    window.removeEventListener("keydown", this.handleInputBound);

    this.optionObjects = [];
    this.bg = null;
    this.game = null;
  }
}
