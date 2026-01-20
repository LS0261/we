export class Camera {
  constructor(containerOrCanvas, zIndex = 1) {
    if (containerOrCanvas instanceof HTMLCanvasElement) {
      this.canvas = containerOrCanvas;
    } else {
      this.canvas = document.createElement("canvas");
      containerOrCanvas.appendChild(this.canvas);
    }

    this.ctx = this.canvas.getContext("2d");

    // 🔒 RESOLUCIÓN VIRTUAL FIJA
    this.width = 1280;
    this.height = 720;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Cámara
    this.x = 0;
    this.y = 0;
    this.zoom = 1;

    // 👁 Propiedad de visibilidad
    this.visible = true; // <--- agregado

    // Estilos
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.zIndex = zIndex;
    this.canvas.style.background = "transparent";

    // Escalado inicial
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const scale = Math.min(
      window.innerWidth / this.width,
      window.innerHeight / this.height
    );

    const displayWidth = this.width * scale;
    const displayHeight = this.height * scale;

    // 🔍 SOLO ESCALADO VISUAL (CSS)
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;

    // 🎯 Centrado
    this.canvas.style.left = `${(window.innerWidth - displayWidth) / 2}px`;
    this.canvas.style.top = `${(window.innerHeight - displayHeight) / 2}px`;
  }

begin(clear = true) {
  this.ctx.save();
  this.ctx.setTransform(1,0,0,1,0,0);  // reset

  if (clear) this.clear();             // 🔹 limpiar aquí

  // luego transformaciones de cámara
  this.ctx.translate(this.width/2, this.height/2);
  this.ctx.scale(this.zoom, this.zoom);
  this.ctx.translate(-this.x, -this.y);
}

  end() {
    this.ctx.restore();
  }

  follow(x, y) {
    this.x = x;
    this.y = y;
    console.log(`Cámara movida a: ${x}, ${y}`);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
