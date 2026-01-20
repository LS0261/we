// sc/object/healthBar.js
export default class HealthBar {
  constructor(x, y, width, height, getHealthFn, maxHealth) {
    this.x = x;
    this.y = y;
    this.barWidth = width;
    this.barHeight = height;
    this.getHealth = getHealthFn;
    this.maxHealth = maxHealth || 100;
    this.bgColor = "#f00";
    this.fgColor = "#0f0";
  }

  setColors(bg, fg) {
    this.bgColor = bg;
    this.fgColor = fg;
  }

  update() {
    // Opcional: lógica de suavizado si quieres
    // Ejemplo:
    if (!this.prevHealth) this.prevHealth = this.getHealth();
    const target = this.getHealth();
    const delta = (target - this.prevHealth) * 0.1;
    this.prevHealth += delta;
  }

drawTo(ctx) {
    const healthPercent = Math.max(0, Math.min(1, this.getHealth() / this.maxHealth));

    // Fondo rojo
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(this.x, this.y, this.barWidth, this.barHeight);

    // Verde crece hacia la izquierda
    ctx.fillStyle = this.fgColor;
    const fgWidth = this.barWidth * healthPercent;
    ctx.fillRect(this.x + this.barWidth - fgWidth, this.y, fgWidth, this.barHeight);

    // Borde opcional
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.barWidth, this.barHeight);
}

}
