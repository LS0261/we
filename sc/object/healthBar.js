import FlxSpriteJS from "../utils/FlxSpriteJS.js";
import Paths from "../backend/Paths.js";

const VIRTUAL_WIDTH = 1280;
const VIRTUAL_HEIGHT = 720;

export default class HealthBar {
  constructor(getHealthFn, maxHealth = 100, downScroll = false) {
    this.getHealth = getHealthFn;
    this.maxHealth = maxHealth;
    this.downScroll = downScroll; // si true → barra arriba; false → barra abajo

    this.bg = new FlxSpriteJS(0, 0);
    this.leftBar = new FlxSpriteJS(0, 0);
    this.rightBar = new FlxSpriteJS(0, 0);

    this.percent = 1;
    this.displayedPercent = 1;

    this.bg.loadGraphic(Paths.image("healthBar")).then(() => {
      this.bg.setGraphicSize(this.bg.image.width);
      this.bg.updateHitbox();

      this.barWidth = this.bg.width - 6;
      this.barHeight = this.bg.height - 6;

      // 📌 POSICIÓN DINÁMICA SEGÚN SCROLL
      const margin = 20; // margen desde el borde superior o inferior
      const posX = (VIRTUAL_WIDTH - this.bg.width) / 2;

      let posY;
      if (this.downScroll) {
        // barra arriba
        posY = margin;
      } else {
        // barra abajo (default)
        posY = VIRTUAL_HEIGHT * 0.89; //0.11
      }

      this.setPosition(posX, posY);
    });
  }

  update() {
    if (this.prevHealth === undefined) {
      this.prevHealth = this.getHealth();
    }

    const raw = this.getHealth();
    const target = Math.max(0, Math.min(1, raw / this.maxHealth));

    // animación suave
    this.prevHealth += (target - this.prevHealth) * 0.1;
    this.displayedPercent = this.prevHealth;
  }

  setPosition(x, y) {
    this.bg.pos[0] = x;
    this.bg.pos[1] = y;
  }

  draw(ctx) {
    ctx.save();
    // ❌ NO resetear transform → respeta zoom de camHUD
    // ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (!this.bg.image) {
      ctx.restore();
      return;
    }

    const bx = this.bg.pos[0];
    const by = this.bg.pos[1];

    const center = this.barWidth / 2;
    const offset = (this.displayedPercent - 0.5) * this.barWidth;

    // background
    this.bg.draw(ctx);

    // LEFT (oponente)
    ctx.fillStyle = this.rightColor || "#FF0000";
    ctx.fillRect(
      bx + 3,
      by + 3,
      Math.max(0, center - offset),
      this.barHeight
    );

    // RIGHT (player)
    ctx.fillStyle = this.leftColor || "#00FF00";
    ctx.fillRect(
      bx + 3 + (center - offset),
      by + 3,
      Math.max(0, this.barWidth - (center - offset)),
      this.barHeight
    );

    // borde
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, this.bg.width, this.bg.height);

    ctx.restore();
  }
  get y() {
  return this.bg.pos[1];
}

get height() {
  return this.barHeight;
}

}
