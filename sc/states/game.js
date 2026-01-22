import ClientPrefs from "./../backend/clientPrefs.js";
import TitleState from './TitleState.js';

export const Game = {
  currentState: null,
  lastTimestamp: 0,
  clientPrefs: null, // <--- agregar esto

  start() {
    // Inicializa clientPrefs una vez al inicio
    this.clientPrefs = new ClientPrefs();
    this.clientPrefs.loadPrefs();

    this.changeState(new TitleState(this)); // Comienza con TitleState
    this.lastTimestamp = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  },

  loop(timestamp) {
    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    if (this.currentState && !this.currentState.closedState) {
      if (typeof this.currentState.update === "function") {
        this.currentState.update(delta);
      }
      if (typeof this.currentState.draw === "function") {
        this.currentState.draw();
      }
    }

    requestAnimationFrame(this.loop.bind(this));
  },

  changeState(newState) {
    if (this.currentState) {
      if (typeof this.currentState.destroy === "function") {
        this.currentState.destroy();
      }
      this.currentState.closedState = true;
    }

    this.currentState = newState;
  }
};
