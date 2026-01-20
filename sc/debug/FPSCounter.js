// FPSCounter.js

export class FPSCounter {
  constructor(maxFPS = 60) {
    this.maxFPS = maxFPS;
    this.frameDuration = 1000 / maxFPS;

    this.lastFrameTime = performance.now();
    this.lastFpsUpdate = performance.now();
    this.framesThisSecond = 0;
    this.fps = 0;

    this.fpsDisplay = document.createElement("div");
    this.fpsDisplay.style.position = "absolute";
    this.fpsDisplay.style.top = "10px";
    this.fpsDisplay.style.left = "10px";
    this.fpsDisplay.style.color = "lime";
    this.fpsDisplay.style.fontSize = "20px";
    this.fpsDisplay.style.fontFamily = "monospace";
    this.fpsDisplay.style.zIndex = "1000";
    this.fpsDisplay.style.background = "rgba(0, 0, 0, 0.5)";
    this.fpsDisplay.style.padding = "5px 10px";
    this.fpsDisplay.style.borderRadius = "5px";
    document.body.appendChild(this.fpsDisplay);

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loop(now) {
    const delta = now - this.lastFrameTime;

    if (delta >= this.frameDuration) {
      this.lastFrameTime = now - (delta % this.frameDuration);

      // Calcular FPS
      if (now - this.lastFpsUpdate >= 1000) {
        this.fps = this.framesThisSecond;
        this.framesThisSecond = 0;
        this.lastFpsUpdate = now;
        this.fpsDisplay.textContent = "FPS: " + this.fps;
      }

      this.framesThisSecond++;

      // Aquí podés ejecutar lógica si querés hacer algo en cada frame limitado
      // Por ahora solo calcula y muestra FPS
    }

    requestAnimationFrame(this.loop);
  }
}
