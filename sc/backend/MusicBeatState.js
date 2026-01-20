// sc/states/MusicBeatState.js
import CustomFadeTransition from "./CustomFadeTransition.js";

export default class MusicBeatState {
  constructor() {
    this.subState = null;
    this.variables = {};
  }

  // Permite abrir un subestado (como transición, menú, etc.)
  openSubState(state) {
    this.subState = state;
    if (state.create) state.create();
  }

  // Cierra el subestado actual
  closeSubState() {
    if (this.subState && this.subState.destroy) this.subState.destroy();
    this.subState = null;
  }

  // Actualización principal
  update(elapsed) {
    if (this.subState && this.subState.update) {
      this.subState.update(elapsed);
    }
  }

  // Cambiar de estado globalmente
  static switchState(nextState = null, game = null) {
    if (!nextState) return;
    if (!game) return console.warn("No game instance provided for switchState");
    // Transición con fade
    new CustomFadeTransition(game, 0.5, () => {
      game.changeState(nextState);
    });
  }

  // Resetea el estado actual
  static resetState(game) {
    if (!game) return console.warn("No game instance provided for resetState");
    new CustomFadeTransition(game, 0.5, () => {
      game.changeState(game.currentState.constructor); // reinicia el mismo estado
    });
  }

  // Acceder al estado global actual
  static getState(game) {
    if (!game) return null;
    return game.currentState;
  }
}
