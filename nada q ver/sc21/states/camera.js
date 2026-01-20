export class Camera {
  constructor(containerOrCanvas, zIndex = 1) {
    if (containerOrCanvas instanceof HTMLCanvasElement) {
      this.canvas = containerOrCanvas;
    } else {
      this.canvas = document.createElement("canvas");
      containerOrCanvas.appendChild(this.canvas);
    }

    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.x = 0;
    this.y = 0;
    this.zoom = 1;

    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.zIndex = zIndex;
    this.canvas.style.background = "transparent";
  }

  begin() {
    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.translate(-this.x, -this.y);
  }

  end() {
    this.ctx.restore();
  }

follow(targetX, targetY) {
  this.x = targetX - this.width / 2 / this.zoom;
  this.y = targetY - this.height / 2 / this.zoom;
}

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
