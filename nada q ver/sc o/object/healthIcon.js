// sc/object/healthIcon.js

import Paths from '../backend/paths.js';

export class HealthIcon {
  constructor(char = 'face', isPlayer = false) {
    this.char = '';
    this.iconOffsets = [0, 0];
    this.isPlayer = isPlayer;
    this.sprite = new Image();
    this.x = 0;
    this.y = 0;
    this.sprTracker = null;
    this.autoAdjustOffset = true;
    this.visible = true;
    this.alpha = 1;

    // --- NUEVAS PROPIEDADES PARA ZOOM POR BEAT ---
    this.zoom = 1;        // escala actual
    this.zoomTarget = 1;  // objetivo para suavizado
    this.frames = 1;      // cantidad de frames (1 o 2)

    this.changeIcon(char);
  }

  update() {
    if (this.sprTracker) {
      this.x = this.sprTracker.x + this.sprTracker.width + 12;
      this.y = this.sprTracker.y - 30;
    }

    // Suavizado del zoom
    this.zoom += (this.zoomTarget - this.zoom) * 0.2;
  }

  async changeIcon(char) {
    if (this.char === char) return;

    const tryPaths = [
      `icons/icon-${char}`,
      `icons/icon-face`
    ];

    let finalPath = '';
    for (let path of tryPaths) {
      const url = Paths.image(path);
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
          finalPath = url;
          break;
        }
      } catch (e) {}
    }

    if (!finalPath) return;

    this.sprite.src = finalPath;
    this.char = char;

    this.sprite.onload = () => {
      // Detectar si el icono tiene 2 frames (ancho mayor al alto)
      this.frames = (this.sprite.width > this.sprite.height) ? 2 : 1;

      // Offsets aproximados para centrar
      const iSize = Math.round(this.sprite.width / this.sprite.height);
      this.iconOffsets[0] = (this.sprite.width - 150) / iSize;
      this.iconOffsets[1] = (this.sprite.height - 150) / iSize;
    };
  }

  draw(ctx, health, isPlayer = false) {
    if (!this.visible || this.alpha <= 0 || !this.sprite.complete) return;

    let frame = 0;

    // Seleccionar frame según la salud solo si hay 2 frames
    if (this.frames === 2 && !isNaN(health)) {
      if (isPlayer && health < 0.2) frame = 1;   // BF en perder
      if (!isPlayer && health > 0.8) frame = 1;  // DAD en perder
    }

    const frameWidth = this.sprite.width / this.frames;

    ctx.save();
    ctx.globalAlpha = this.alpha ?? 1;

    // CENTRAR Y ESCALAR POR ZOOM
    ctx.translate(this.x + frameWidth / 2, this.y + this.sprite.height / 2);
    ctx.scale(this.isPlayer ? this.zoom : -this.zoom, this.zoom);
    ctx.translate(-frameWidth / 2, -this.sprite.height / 2);

    ctx.drawImage(
      this.sprite,
      frame * frameWidth, 0, frameWidth, this.sprite.height, // source rect
      0 - this.iconOffsets[0], 0 - this.iconOffsets[1], frameWidth, this.sprite.height // destino
    );
    ctx.restore();
  }

  // --- LLAMAR EN CADA BEAT PARA ZOOM ---
  onBeat() {
    this.zoomTarget = 1.15; // ajusta el zoom máximo por beat
  }

  getCharacter() {
    return this.char;
  }
  getFrameWidth() {
  return this.sprite.width / this.frames;
}

getFrameHeight() {
  return this.sprite.height;
}
}

export default HealthIcon;
