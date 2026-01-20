import Paths from "../../backend/Paths.js";

export default class PauseMenuSubstate {
  constructor(playState) {
    this.playState = playState;
    this.ctx = playState.ctxHUD;
    this.paused = false;
    this.selected = 0;

    this.menuItems = ["Resume", "Restart Song", "Botplay", "Exit to Menu"];
    this.countdown = null;
    this.countValue = 3;

    this.overlayAlpha = 0;
    this.fadeInSpeed = 0.02;
    this.scrollOffset = 0;

    this.songName = playState.songName ?? "Unknown Song";
    this.difficulty = (playState.difficulty ?? "Normal").toUpperCase();
    this.deaths = playState.deaths ?? 0;

    this.bindInputs();
  }

  bindInputs() {
    this.keyHandler = (e) => {
      if (e.code === "KeyE") {
        if (!this.paused) this.pause();
        else this.resume();
      }

      if (!this.paused || this.countdown) return;

      if (e.code === "ArrowUp") this.changeSelection(-1);
      else if (e.code === "ArrowDown") this.changeSelection(1);
      else if (e.code === "Enter") this.selectOption();
    };
    window.addEventListener("keydown", this.keyHandler);
  }

  changeSelection(change) {
    const old = this.selected;
    this.selected =
      (this.selected + change + this.menuItems.length) % this.menuItems.length;

    if (old !== this.selected)
      new Audio(Paths.sound("scrollMenu")).play();
  }

  pause() {
    if (this.paused) return;
    this.paused = true;

    if (this.playState.audioInst) this.playState.audioInst.pause();
    if (this.playState.dadVoice) this.playState.dadVoice.pause();
    if (this.playState.boyfriendVoice) this.playState.boyfriendVoice.pause();

    this.playState._paused = true;
    this.loopBackup = this.playState.loop;
    this.playState.loop = (t) => this.update(t);
  }

  resume() {
    // ✅ destruye el menú al resumir (ya no sigue dibujando)
    this.destroy();
    if (this.playState.audioInst) this.playState.audioInst.play();
    if (this.playState.dadVoice) this.playState.dadVoice.play();
    if (this.playState.boyfriendVoice) this.playState.boyfriendVoice.play();

    this.paused = false;
    this.playState._paused = false;
    this.playState.loop = this.loopBackup;
    requestAnimationFrame((t) => this.playState.loop(t));
  }

  selectOption() {
    const option = this.menuItems[this.selected];
    switch (option) {
      case "Resume":
        this.startCountdown();
        break;
      case "Restart Song":
        this.restart();
        break;
      case "Exit to Menu":
        this.exitToMenu();
        break;
      case "Botplay":
        this.toggleBotplay();
        break;
    }
  }

  toggleBotplay() {
    this.playState.autoPlay = !this.playState.autoPlay;
    new Audio(Paths.sound("scrollMenu")).play();
  }

  startCountdown() {
    // ✅ Empieza una cuenta regresiva normal (3, 2, 1, Go)
    this.countdown = true;
    this.countValue = 3;
    this.lastTick = performance.now();
    new Audio(Paths.sound("scrollMenu")).play();
  }

  update(timestamp) {
    const ctx = this.ctx;
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo oscuro
    if (this.overlayAlpha < 0.6) this.overlayAlpha += this.fadeInSpeed;
    ctx.fillStyle = `rgba(0,0,0,${this.overlayAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Info
    ctx.textAlign = "left";
    ctx.font = "28px 'VCR OSD Mono', monospace";
    ctx.fillStyle = "#FFF";
    ctx.fillText(this.songName, canvas.width - 250, 50);
    ctx.fillText(this.difficulty, canvas.width - 250, 90);
    ctx.fillText("Blueballed: " + this.deaths, canvas.width - 250, 130);

    // --- Cuenta regresiva ---
    if (this.countdown) {
      const now = performance.now();
      const elapsed = now - this.lastTick;

      const bpm = this.playState?.bpmSections?.[0]?.bpm ?? this.playState?.songBpm ?? 120;
      const beatMs = 60000 / bpm;

      if (elapsed >= beatMs) {
        this.countValue--;
        this.lastTick = now;
        if (this.countValue > 0) {
          new Audio(Paths.sound("scrollMenu")).play();
        } else {
          this.countdown = false;
          this.resume();
          return;
        }
      }

      ctx.textAlign = "center";
      ctx.font = "96px 'VCR OSD Mono', monospace";
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 6;
      ctx.strokeText(this.countValue.toString(), centerX, centerY);
      ctx.fillText(this.countValue.toString(), centerX, centerY);

      requestAnimationFrame((t) => this.update(t));
      return;
    }

    // --- Menú ---
    const itemSpacing = 60;
    const baseY = centerY - (this.menuItems.length / 2) * itemSpacing;

    ctx.textAlign = "center";
    ctx.font = "48px 'VCR OSD Mono', monospace";

    this.menuItems.forEach((item, i) => {
      let text = item;
      if (item === "Botplay") {
        const state = this.playState.autoPlay ? "ON" : "OFF";
        text = `Botplay: ${state}`;
      }

      const y = baseY + i * itemSpacing;
      const color = i === this.selected ? "#FFD700" : "#FFFFFF";
      const alpha = i === this.selected ? 1 : 0.6;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.strokeText(text, centerX, y);
      ctx.fillText(text, centerX, y);
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame((t) => this.update(t));
  }

  restart() {
    import("../../backend/CustomFadeTransition.js").then(
      ({ default: CustomFadeTransition }) => {
        new CustomFadeTransition(this.playState.game, 0.5, () => {
          const songName = this.playState.songName;
          this.playState.destroy();
          this.playState.game.changeState(
            new this.playState.constructor(this.playState.game, songName)
          );
        });
      }
    );
  }

  exitToMenu() {
    import("../../backend/CustomFadeTransition.js").then(
      ({ default: CustomFadeTransition }) => {
        new CustomFadeTransition(this.playState.game, 0.5, () => {
          this.playState.destroy();
          import("../FreeplayState.js").then(({ default: FreeplayState }) => {
            this.playState.game.changeState(
              new FreeplayState(this.playState.game)
            );
          });
        });
      }
    );
  }

  destroy() {
    // ✅ elimina inputs y limpia pantalla
    window.removeEventListener("keydown", this.keyHandler);
    const ctx = this.ctx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}
