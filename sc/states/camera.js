export class Camera {
  /**
   * @param {HTMLElement|HTMLCanvasElement} containerOrCanvas - Donde se agregará la cámara o un canvas existente
   * @param {number} zIndex - Orden visual de la cámara
   * @param {string} backgroundColor - Color de fondo (ej: "#000000" o "transparent")
   */
  constructor(containerOrCanvas, zIndex = 1, backgroundColor = "#000000") {
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
    this.rotation = 0;
    this.visible = true;

    // Fondo configurable
    this.backgroundColor = backgroundColor;

    // Estilos CSS
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.zIndex = zIndex;
    this.canvas.style.background = "transparent"; // siempre transparente a nivel de CSS

    // Escalado inicial
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  // Cambiar el fondo dinámicamente
  setBackground(color) {
    this.backgroundColor = color;
  }

  resize() {
    const scale = Math.min(
      window.innerWidth / this.width,
      window.innerHeight / this.height
    );

    const displayWidth = this.width * scale;
    const displayHeight = this.height * scale;

    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;

    // Centrado
    this.canvas.style.left = `${(window.innerWidth - displayWidth) / 2}px`;
    this.canvas.style.top = `${(window.innerHeight - displayHeight) / 2}px`;
  }

  // Iniciar cámara (preparar contexto)
  begin(clear = true) {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // resetear transformaciones

    if (clear) this.clear();

    // ➡ Mover el contexto al centro
    this.ctx.translate(this.width / 2, this.height / 2);

    // ➡ Rotación
    this.ctx.rotate(this.rotation);

    // ➡ Zoom
    this.ctx.scale(this.zoom, this.zoom);

    // ➡ Mover el mundo según la posición de la cámara
    this.ctx.translate(-this.x, -this.y);
  }

  // Finalizar cámara (restaurar contexto)
  end() {
    this.ctx.restore();
  }

  follow(x, y) {
    this.x = x;
    this.y = y;
    // console.log(`Cámara movida a: ${x}, ${y}`);
  }

  // Limpia el canvas y dibuja el fondo según backgroundColor
  clear() {
    if (this.backgroundColor === "transparent") {
      this.ctx.clearRect(0, 0, this.width, this.height);
    } else {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }
}
