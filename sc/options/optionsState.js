// sc/states/OptionsState.js
import Paths from "../backend/Paths.js";
import MusicBeatState from "../backend/MusicBeatState.js";
import MainMenuState from "../states/MainMenuState.js";
import CustomFadeTransition from "../backend/CustomFadeTransition.js";
import ControlsState from "./ControlsState.js"; // ajusta la ruta según tu estructura de carpetas

export default class OptionsState extends MusicBeatState {
  constructor(game) {
    super();
    this.game = game;

    this.options = [
      'Note Colors',
      'Controls',
      'Adjust Delay and Combo',
      'Graphics',
      'Visuals',
      'Gameplay',
      'Language'
    ];

    this.curSelected = 0;
    this.selectorLeft = '>';
    this.selectorRight = '<';
    this.onPlayState = false;

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
    // --- Fondo ---
    this.bg = new Image();
    this.bg.src = Paths.image('menuDesat');
    await new Promise(res => this.bg.onload = res);

    // --- Opciones ---
    const spacing = 92;
    this.optionObjects = [];
    for (let i = 0; i < this.options.length; i++) {
      const opt = {
        text: this.options[i],
        x: this.canvas.width / 2,
        y: this.canvas.height / 2 + (spacing * (i - this.options.length / 2)) + 45,
        alpha: 1
      };
      this.optionObjects.push(opt);
    }

    // --- Listeners ---
    this.handleInputBound = (e) => this.handleInput(e);
    window.addEventListener("keydown", this.handleInputBound);

    // --- Loop ---
    this.loopId = requestAnimationFrame((t) => this.loop(t));
  }

  handleInput(e) {
    if (e.key === "ArrowUp") this.changeSelection(-1);
    if (e.key === "ArrowDown") this.changeSelection(1);
    if (e.key === "Enter") this.selectOption();
    if (e.key === "Escape") this.closeOptions();
  }

  changeSelection(change = 0) {
    this.curSelected = (this.curSelected + change + this.options.length) % this.options.length;

    for (let i = 0; i < this.optionObjects.length; i++) {
      const item = this.optionObjects[i];
      item.targetY = i - this.curSelected;
      item.alpha = (item.targetY === 0) ? 1 : 0.6;

      if (item.targetY === 0 && change !== 0) {
        const audio = new Audio(Paths.sound('scrollMenu'));
        audio.volume = 0.7;
        audio.play();
      }
    }
  }

selectOption() {
  const option = this.options[this.curSelected];
  const audio = new Audio(Paths.sound("confirmMenu"));
  audio.volume = 0.7;
  audio.play();

  console.log("Opción confirmada:", option);

  const gameRef = this.game; // <-- captura la referencia
  new CustomFadeTransition(gameRef, 1.0, () => {
    switch(option) {
      case 'Controls':
        gameRef.changeState(new ControlsState(gameRef)); // <-- nuevo subestado
      break;            
      }

      console.log("Abrir subestado de:", option);

    });
}

closeOptions() {
  new CustomFadeTransition(this.game, 1.0, async () => {
    const newState = new MainMenuState(this.game);

    // Espera a que se cargue todo
    await newState.load();

    // Ahora sí cambiar de estado
    this.game.changeState(newState);
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

    // Dibujar opciones
    this.ctx.font = "36px 'VRCFont'";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    for (let i = 0; i < this.optionObjects.length; i++) {
      const item = this.optionObjects[i];
      const y = item.y - this.camY;

      this.ctx.globalAlpha = item.alpha;
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.fillText(item.text, item.x, y);

      // Selectores
      if (i === this.curSelected) {
        this.ctx.fillText(this.selectorLeft, item.x - 200, y);
        this.ctx.fillText(this.selectorRight, item.x + 200, y);
      }
    }
    this.ctx.globalAlpha = 1;

    this.loopId = requestAnimationFrame((t) => this.loop(t));
  }

  destroy() {
    console.log("Destruyendo OptionsState...");

    // Cancelar loop
    if (this.loopId) {
      cancelAnimationFrame(this.loopId);
      this.loopId = null;
    }

    // Remover listeners
    window.removeEventListener("keydown", this.handleInputBound);

    // Limpiar arrays y referencias
    this.optionObjects = [];
    this.bg = null;
    this.game = null;
  }
}
