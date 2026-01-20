export default class CustomFadeTransition {
  constructor(game, duration = 1.0, callback = null) {
    this.game = game;
    this.duration = duration * 1000; // duración en ms
    this.callback = callback;

    // contenedor
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.top = "0";
    this.div.style.left = "0";
    this.div.style.width = "100%";
    this.div.style.height = "100%";
    this.div.style.pointerEvents = "none";
    this.div.style.overflow = "hidden";
    this.div.style.zIndex = "9999";

    const halfH = "50%";

    // 🔹 parte superior
    this.top = document.createElement("div");
    this.top.style.position = "absolute";
    this.top.style.width = "100%";
    this.top.style.height = halfH;
    this.top.style.background = "black";
    this.top.style.transition = `top ${this.duration}ms ease-in-out, left ${this.duration}ms ease-in-out`;

    // 🔹 parte inferior
    this.bottom = document.createElement("div");
    this.bottom.style.position = "absolute";
    this.bottom.style.width = "100%";
    this.bottom.style.height = halfH;
    this.bottom.style.background = "black";
    this.bottom.style.transition = `bottom ${this.duration}ms ease-in-out, right ${this.duration}ms ease-in-out`;

    // Estado inicial (fuera de pantalla)
    this.top.style.top = "-50%";
    this.top.style.left = "-100%";
    this.bottom.style.bottom = "-50%";
    this.bottom.style.right = "-100%";

    this.div.appendChild(this.top);
    this.div.appendChild(this.bottom);
    document.body.appendChild(this.div);

    // 🎬 fase IN (entrar)
    requestAnimationFrame(() => {
      this.top.style.top = "0";
      this.top.style.left = "0";

      this.bottom.style.bottom = "0";
      this.bottom.style.right = "0";
    });

    // ⏱️ cuando termina IN
    setTimeout(() => {
      // ✅ ejecutar callback aquí (pantalla ya negra)
      if (this.callback) this.callback();

      // pausa negra
      const pause = 400; // tiempo extra en negro
      setTimeout(() => {
        // 🎬 fase OUT (salir)
        this.top.style.top = "-50%";
        this.top.style.left = "-100%";
        this.bottom.style.bottom = "-50%";
        this.bottom.style.right = "-100%";

        // ⏱️ quitar al terminar OUT
        setTimeout(() => {
          this.endTransition();
        }, this.duration);
      }, pause);
    }, this.duration);
  }

  endTransition() {
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
    }
  }
}
