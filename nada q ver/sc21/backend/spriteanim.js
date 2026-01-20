// sc/backend/spriteanim.js
import Paths from "./Paths.js";

export class SpriteAnim {
  constructor(name) {
    this.name = name;

    this.image = new Image();
    this.xml = null;

    this.atlasFrames = {};  // ← todos los frames por nombre
    this.frames = {};       // ← animaciones: listas de nombres de frame
    this.frameData = {};
    this.offsets = {};

    this.animName = null;
    this.animTimer = 0;
    this.frameIndex = 0;
    this.flipX = false;

    this.loaded = false;
    this.scale = 1;
    this.pos = [0, 0];
    this.alpha = 1;
    this.tint = null;
    this.rotation = 0;
  }

  async init({ imageName = null, position = [0, 0], scale = 1, flipX = false } = {}) {
    this.pos = position;
    this.scale = scale;
    this.flipX = flipX;

    const base = imageName || this.name;

    // === Imagen ===
    const imagePath = Paths.image(base);
    console.log(`Intentando cargar imagen desde: ${imagePath}`);
    this.image.src = imagePath;
    await new Promise((resolve, reject) => {
      this.image.onload = () => {
        console.log(`✅ Imagen cargada: ${this.image.width}x${this.image.height}`);
        resolve();
      };
      this.image.onerror = () => reject(new Error(`Error al cargar imagen: ${imagePath}`));
    });

    // === Atlas XML ===
    const atlasPath = Paths.textureAtlas(base);
    console.log(`Intentando cargar atlas XML desde: ${atlasPath}`);

    try {
      const response = await fetch(atlasPath);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const xmlText = await response.text();
      const parser = new DOMParser();
      this.xml = parser.parseFromString(xmlText, "application/xml");

      // Guardar frames en atlasFrames
      this.atlasFrames = {};
      this.xml.querySelectorAll("SubTexture").forEach(sub => {
        const name = sub.getAttribute("name");
        this.atlasFrames[name] = {
          x: parseInt(sub.getAttribute("x")),
          y: parseInt(sub.getAttribute("y")),
          width: parseInt(sub.getAttribute("width")),
          height: parseInt(sub.getAttribute("height")),
          frameX: parseInt(sub.getAttribute("frameX") || 0),
          frameY: parseInt(sub.getAttribute("frameY") || 0),
          frameWidth: parseInt(sub.getAttribute("frameWidth") || sub.getAttribute("width")),
          frameHeight: parseInt(sub.getAttribute("frameHeight") || sub.getAttribute("height")),
        };
      });

      this.loaded = true;
      console.log("📂 Frames disponibles:", Object.keys(this.atlasFrames).slice(0, 50));
    } catch (error) {
      console.error(`Error cargando atlas XML desde ${atlasPath}:`, error);
      this.loaded = false;
    }
  }

  addAnim(animName, prefix, fps = 24, loop = true, offsets = [0, 0], indices = null) {
    if (!this.xml) {
      console.warn("XML no está cargado. Llama init() primero.");
      return;
    }

    let foundFrames = Array.from(this.xml.querySelectorAll("SubTexture"))
      .filter(node => node.getAttribute("name").startsWith(prefix))
      .map(node => node.getAttribute("name"));

    if (foundFrames.length === 0) {
      const single = this.xml.querySelector(`SubTexture[name="${prefix}"]`);
      if (single) foundFrames = [single.getAttribute("name")];
    }

    if (indices && indices.length > 0) {
      foundFrames = indices.map(i => foundFrames[i]).filter(f => f);
    }

    this.frames[animName] = foundFrames;
    this.frameData[animName] = { fps, loop };
    this.offsets[animName] = offsets;

    if (!this.animName && foundFrames.length > 0) {
      this.play(animName);
    }
  }

  play(anim, forceRestart = false) {
    if (this.animName !== anim || forceRestart) {
      this.animName = anim;
      this.animTimer = 0;
      this.frameIndex = 0;
    }
  }

  update(delta) {
    if (!this.loaded) return;

    const def = this.frameData[this.animName];
    if (!def || def.fps <= 0) return;

    this.animTimer += delta;
    const frameTime = 1 / def.fps;

    while (this.animTimer >= frameTime) {
      this.animTimer -= frameTime;
      this.frameIndex++;
      if (this.frameIndex >= this.frames[this.animName].length) {
        this.frameIndex = def.loop ? 0 : this.frames[this.animName].length - 1;
      }
    }
  }

  get width() {
    if (!this.loaded || !this.frames[this.animName]) return 0;
    const frameName = this.frames[this.animName][this.frameIndex];
    const frame = this.atlasFrames[frameName];
    if (!frame) return 0;
    return frame.frameWidth * this.scale;
  }

  get height() {
    if (!this.loaded || !this.frames[this.animName]) return 0;
    const frameName = this.frames[this.animName][this.frameIndex];
    const frame = this.atlasFrames[frameName];
    if (!frame) return 0;
    return frame.frameHeight * this.scale;
  }

draw(ctx) {
  if (!this.loaded || !this.image || this.image.width === 0) return;

  const animFrames = this.frames[this.animName];
  if (!animFrames || animFrames.length === 0) return;

  const frameName = animFrames[this.frameIndex];
  const frame = this.atlasFrames[frameName];
  if (!frame) return;

  const { x, y, width, height, frameX, frameY, frameWidth, frameHeight } = frame;
  let [ox, oy] = this.offsets[this.animName] || [0, 0];
  const s = this.scale;

  // canvas intermedio para escalar
  if (!this._off) this._off = document.createElement("canvas");
  const off = this._off;
  const offW = Math.max(1, Math.round(frameWidth * s));
  const offH = Math.max(1, Math.round(frameHeight * s));
  if (off.width !== offW || off.height !== offH) {
    off.width = offW;
    off.height = offH;
  }
  const octx = off.getContext("2d");
  octx.clearRect(0, 0, off.width, off.height);

  octx.drawImage(
    this.image,
    x, y, width, height,
    Math.round(-frameX * s),
    Math.round(-frameY * s),
    Math.round(width * s),
    Math.round(height * s)
  );

  ctx.save();
  ctx.globalAlpha = this.alpha;

// ✅ aplicar offset y flip correctamente
let drawX = this.pos[0];
let drawY = this.pos[1];

if (this.flipX) {
  // invertimos el offset X
  drawX -= ox;
  drawY += oy;
} else {
  drawX += ox;
  drawY += oy;
}

ctx.translate(drawX, drawY);
if (this.flipX) ctx.scale(-1, 1);
if (this.rotation !== 0) ctx.rotate(this.rotation);

ctx.drawImage(off, 0, 0);

  ctx.restore();
}

}
