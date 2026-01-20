import Game from './sc/Game.js';
import TitleState from './sc/states/titleState.js';

const game = new Game();
window.game = game; // para acceder desde los states
game.changeState(new TitleState());
game.loop();
