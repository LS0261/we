// game.js
import TitleState from './TitleState.js';
import MainMenuState from './MainMenuState.js';

export const Game = {
  currentState: null,
  lastTimestamp: 0,

  // ⚡ flags globales
  introPlayed: false,   // la intro solo una vez
  menuMusic: null,      // 🎵 música global única (se inicia en TitleState)

  start() {
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
    // ✅ destruir estado anterior si existe
    if (this.currentState) {
      if (typeof this.currentState.destroy === "function") {
        this.currentState.destroy();
      }
      this.currentState.closedState = true;
    }

    this.currentState = newState;
  }
};
