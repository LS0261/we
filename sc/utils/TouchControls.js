import { SpriteAnim } from "../backend/SpriteAnim.js";
import Paths from "../backend/Paths.js";

export default class TouchControls {
  constructor(canvas, onInput) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onInput = onInput;
    this.buttons = {};
    this.scale = 0.6;
    this.margin = 10;
    this.ready = false;
  }

  async initButtons() {
    const btnConfig = [
      { name: "up", action: "up", offsetX: -70, offsetY: -130 },
      { name: "down", action: "down", offsetX: -70, offsetY: 10 },
      { name: "left", action: "left", offsetX: -130, offsetY: -60 },
      { name: "right", action: "right", offsetX: 50, offsetY: -60 },
      { name: "a", action: "accept", offsetX: -250, offsetY: -30 },
      { name: "b", action: "cancel", offsetX: -250, offsetY: 70 },
    ];

    const startX = this.canvas.width - 400 * this.scale - this.margin;
    const startY = this.canvas.height - 127 * this.scale - this.margin;

    for (let cfg of btnConfig) {
      const sprite = new SpriteAnim("virtualpad");
      await sprite.init({ scale: this.scale, position: [startX + cfg.offsetX, startY + cfg.offsetY] });
      sprite.addAnim(cfg.name, cfg.name); // el nombre del frame en tu atlas
      sprite.play(cfg.name);
      this.buttons[cfg.action] = sprite;
    }

    this.bindEvents();
    this.ready = true;
    console.log("✅ TouchControls listos con SpriteAnim");
  }

  bindEvents() {
    this._touchHandler = (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      for (let t of e.touches) {
        const x = (t.clientX - rect.left) * scaleX;
        const y = (t.clientY - rect.top) * scaleY;

        for (let action in this.buttons) {
          const btn = this.buttons[action];
          if (!btn) continue;
          if (x >= btn.pos[0] && x <= btn.pos[0] + btn.width &&
              y >= btn.pos[1] && y <= btn.pos[1] + btn.height) {
            this.onInput(action);
          }
        }
      }
    };

    this.canvas.addEventListener("touchstart", this._touchHandler, { passive: false });
    this.canvas.addEventListener("touchmove", this._touchHandler, { passive: false });
  }

  draw() {
    if (!this.ready) return;
    for (let key in this.buttons) {
      this.buttons[key]?.draw(this.ctx);
    }
  }

  destroy() {
    if (this._touchHandler) {
      this.canvas.removeEventListener("touchstart", this._touchHandler);
      this.canvas.removeEventListener("touchmove", this._touchHandler);
    }
    this.buttons = {};
    this.ready = false;
  }
}