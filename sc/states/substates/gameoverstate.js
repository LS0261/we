import Paths from "../../backend/paths.js";
import { Character } from "../../object/character.js";
import CustomFadeTransition from "../../backend/CustomFadeTransition.js";

export default class GameOverState {
  constructor(playState) {
    this.playState = playState;
    this.camGame = playState.camGame; // 👈 cámara del juego
    this.camHUD = playState.camHUD; // 👈 cámara del juego
    this.ctx = this.camGame.ctx;

    this.camHUD.visible = false; // ocultar HUD

    this.camHUD.canvas.style.display = "none"; // ❌ oculta el HUD

    this.bf = null;
    this.dad = this.playState.dad;
    this.gf = this.playState.gf;

    this.isEnding = false;
    this.loopAudio = null;
    this.keys = {};

    this.overlayAlpha = 1;
    this.fadeToBlackAlpha = 0;
    this.fadingToBlack = false;

    this.deathSound = Paths.sound("fnf_loss_sfx");
    this.loopMusic = Paths.music("gameOver");
    this.endMusic = Paths.music("gameOverEnd");

    // Pausar audio principal
    if (this.playState.audioInst) this.playState.audioInst.pause();
    if (this.playState.boyfriendVoice) this.playState.boyfriendVoice.pause();
    if (this.playState.dadVoice) this.playState.dadVoice.pause();

    // Inputs
    this.keyDownHandler = (e) => (this.keys[e.code] = true);
    this.keyUpHandler = (e) => (this.keys[e.code] = false);
    window.addEventListener("keydown", this.keyDownHandler);
    window.addEventListener("keyup", this.keyUpHandler);

    if (this.playState.callOnScripts)
      this.playState.callOnScripts("onGameOverStart", []);

    // Cargamos BF-dead
    this.loadBFDead();
    
// Dentro del constructor
this.keyDownHandler = (e) => {
  this.keys[e.code] = true;

  // Aquí detectamos la tecla Back / Escape
  if (e.code === "Escape" || e.code === "Backspace") {
    this.exitGameOver();
  }
};

this.keyUpHandler = (e) => (this.keys[e.code] = false);

  }

async loadBFDead() {
  try {
    this.bf = new Character("bf-dead", true);

    await this.bf.init({
      position: [this.playState.boyfriend.x, this.playState.boyfriend.y]
    });

    // 🔹 Hacer que la cámara siga al BF-dead
    this.playState.camTarget = this.bf;

    this.playDeathSound();
    this.playFirstDeathAnim();
  } catch (err) {
    console.error("Error cargando bf-dead:", err);
    this.bf = this.playState.boyfriend; // fallback

    // 🔹 También aquí, si falla, cámara sigue al BF normal
    this.playState.camTarget = this.bf;

    this.playDeathSound();
    this.playFirstDeathAnim();
  }
}

  playDeathSound() {
    const audio = new Audio(this.deathSound);
    audio.play();
  }

  playFirstDeathAnim() {
    if (!this.bf || !this.bf.playAnim) return;

    const tryPlay = () => {
      if (!this.bf.frames || Object.keys(this.bf.frames).length === 0) {
        requestAnimationFrame(tryPlay);
        return;
      }

      this.bf.playAnim("firstDeath");

      const checkAnim = () => {
        if (!this.bf.isAnimationFinished()) {
          requestAnimationFrame(checkAnim);
        } else {
          if (this.bf.playAnim) this.bf.playAnim("deathLoop");
          this.playLoopMusic();
        }
      };
      checkAnim();
    };

    tryPlay();
  }

  playLoopMusic() {
    if (this.loopAudio) return;

    this.loopAudio = new Audio(this.loopMusic);
    this.loopAudio.loop = true;
    this.loopAudio.volume = 1;
    this.loopAudio.preload = "auto";
    this.loopAudio.play().catch(() => {});
  }
exitGameOver() {
  if (this.isEnding) return;
  this.isEnding = true;

  // Quitamos listeners
  window.removeEventListener("keydown", this.keyDownHandler);
  window.removeEventListener("keyup", this.keyUpHandler);

  // Detenemos cualquier música de game over
  if (this.loopAudio) {
    this.loopAudio.pause();
    this.loopAudio.currentTime = 0;
  }

  // Fade rápido y cambio de estado
  this.fadingToBlack = true;
  this.fadeToBlackAlpha = 0;
  this.fadeCompleteCallback = () => {
    // Suponiendo que quieras ir al MainMenuState
    new CustomFadeTransition(this.game, 1.0, () => {
      this.destroy();
      import("../FreeplayState.js").then(({ default: FreeplayState }) => {
        this.game.changeState(new FreeplayState(this.game));
      });
    });
  };
}

  update(delta) {
    if (!this.isEnding && (this.keys["Enter"] || this.keys["Space"])) {
      this.startEndSequence();
    }

    if (this.fadingToBlack) {
      this.fadeToBlackAlpha += delta / 2;
      if (this.fadeToBlackAlpha >= 1) {
        this.fadeToBlackAlpha = 1;
        this.fadingToBlack = false;
        if (this.fadeCompleteCallback) this.fadeCompleteCallback();
      }
    }

    // Actualizamos BF-dead para animaciones
    if (this.bf?.update) this.bf.update(delta);

    if (this.playState.callOnScripts) this.playState.callOnScripts("onUpdate", [delta]);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(-1000, -1000, 5000, 5000);

    ctx.fillStyle = `rgba(0,0,0,${this.overlayAlpha})`;
    ctx.fillRect(-1000, -1000, 5000, 5000);

    if (this.bf?.draw) this.bf.draw(ctx);

    if (this.fadingToBlack || this.fadeToBlackAlpha > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.fadeToBlackAlpha})`;
      ctx.fillRect(-1000, -1000, 5000, 5000);
    }
  }

  loop(timestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this.update(delta);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    this.loop(performance.now());
  }

  startEndSequence() {
    if (this.isEnding) return;
    this.isEnding = true;

    window.removeEventListener("keydown", this.keyDownHandler);
    window.removeEventListener("keyup", this.keyUpHandler);

    if (this.loopAudio) {
      this.loopAudio.pause();
      this.loopAudio.currentTime = 0;
    }

    const endAudio = new Audio(this.endMusic);
    endAudio.play();

    this.bf.playAnim("deathConfirm");

    this.fadingToBlack = true;
    this.fadeToBlackAlpha = 0;
    this.fadeCompleteCallback = () => {
      new CustomFadeTransition(this.playState.game, 0.5, () => {
        const songName = this.playState.songName;
        const PlayStateClass = this.playState.constructor;
        this.playState.destroy();
        this.playState.game.changeState(new PlayStateClass(this.playState.game, songName));
      });
    };
  }

  destroy() {
    window.removeEventListener("keydown", this.keyDownHandler);
    window.removeEventListener("keyup", this.keyUpHandler);
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }
}
