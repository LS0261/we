// utils/FlxSpriteJS.js
export default class FlxSpriteJS {
  constructor(x = 0, y = 0) {
    this.pos = [x, y];
    this.image = null;
    this.width = 0;
    this.height = 0;
    this.visible = true;
    this.antialiasing = true;
    this.scale = 3;
    this.canvas = document.getElementById('canvas'); // detecta canvas automáticamente
  }

loadGraphic(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            this.image = img;
            this.width = img.width;
            this.height = img.height;
            resolve(this);
        };
        img.onerror = () => reject(new Error("No se pudo cargar la imagen: " + src));
    });
}

setGraphicSize(size) {
    if (!this.image) {
        console.warn("setGraphicSize llamado antes de cargar la imagen");
        return;
    }
    this.scale = size / this.image.width;
    this.width = this.image.width * this.scale;
    this.height = this.image.height * this.scale;
}

  updateHitbox() {
    this.hitbox = { w: this.width, h: this.height };
  }

screenCenter(canvas = this.canvas, axis = "XY") {
    if (!canvas) throw new Error("No se encontró el canvas");

    if (axis.includes("X")) this.pos[0] = (canvas.width - this.width) / 2;
    if (axis.includes("Y")) this.pos[1] = (canvas.height - this.height) / 2;
}

draw(ctx) {
  if (
    !this.visible ||
    !this.image ||
    !(this.image instanceof HTMLImageElement)
  ) return;

  ctx.imageSmoothingEnabled = this.antialiasing;
  ctx.drawImage(this.image, this.pos[0], this.pos[1], this.width, this.height);
}

}
