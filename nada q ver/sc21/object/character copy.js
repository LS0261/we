// sc/object/character.js

export class Character {
  constructor(name, isPlayer = false) {
    this.name = name;
    this.isPlayer = isPlayer;
    this.image = new Image();
    this.frames = {};
    this.frameData = {};
    this.offsets = {};
    this.animName = "idle";
    this.animTimer = 0;
    this.frameIndex = 0;
    this.loaded = false;
    this.pos = [0, 0];
    this.scale = 1;
    this.flipX = false;

    this.specialAnim = null;       // animación de canto activa
    this.specialAnimTime = 0;      // tiempo restante de la anim en segundos
  }

  async init() {
    const res = await fetch(`data/characters/${this.name}.json`);
    this.data = await res.json();
    this.image.src = `images/${this.data.image}.png`;
    this.pos = this.data.position || [0, 0];
    this.scale = this.data.scale || 1;
    this.flipX = this.data.flip_x || false;

    const xmlText = await (await fetch(`images/${this.data.image}.xml`)).text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");

    for (let anim of this.data.animations) {
      const name = anim.anim;
      const prefix = anim.name;
      const fps = anim.fps;
      const loop = anim.loop;
      const offsets = anim.offsets || [0, 0];

      let foundFrames = Array.from(xml.querySelectorAll("SubTexture"))
        .filter(n => n.getAttribute("name").startsWith(prefix));
      if (foundFrames.length === 0) {
        const single = xml.querySelector(`SubTexture[name="${prefix}"]`);
        if (single) foundFrames = [single];
      }

      this.frames[name] = foundFrames;
      this.frameData[name] = { fps, loop };
      this.offsets[name] = offsets;
    }

    this.loaded = true;
    if (this.frames["idle"]) this.play("idle");
    this.healthIcon = this.data.healthicon || this.name;
  }

  // Cambiar animación normal
  play(anim) {
    if (!this.frames[anim]) return;
    this.animName = anim;
    this.animTimer = 0;
    this.frameIndex = 0;
  }

  // Cambiar animación de canto (special) usando sing_duration como multiplicador de beats
  playAnim(animName, isSpecial = false, beatLength = 0.5) {
    if (!this.frames[animName]) return;

    this.animName = animName;
    this.animTimer = 0;
    this.frameIndex = 0;

    if (isSpecial) {
      this.specialAnim = animName;

      // Obtener sing_duration desde JSON, default 1
      const animData = this.data.animations.find(a => a.anim === animName);
      const beatsMultiplier = animData?.sing_duration ?? 1;

      // Tiempo real en segundos según beat actual
      this.specialAnimTime = beatsMultiplier * beatLength;
    }
  }

  update(delta) {
    if (!this.loaded) return;

    const def = this.frameData[this.animName];
    if (def && def.fps > 0) {
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

    // Reducir tiempo de specialAnim
    if (this.specialAnim) {
      this.specialAnimTime -= delta;
      if (this.specialAnimTime <= 0) {
        this.specialAnim = null; // desbloquea idle en el próximo beat
        this.specialAnimTime = 0;
      }
    }
  }

  // Se llama en cada beat desde PlayState
  onBeat() {
    if (!this.specialAnim && !this.animName.startsWith("sing")) {
      this.play("idle");
    }
  }

  draw(ctx) {
    if (!this.loaded) return;
    const frames = this.frames[this.animName];
    if (!frames || frames.length === 0) return;
    const frame = frames[this.frameIndex];

    const fx = parseInt(frame.getAttribute("x"));
    const fy = parseInt(frame.getAttribute("y"));
    const fw = parseInt(frame.getAttribute("width"));
    const fh = parseInt(frame.getAttribute("height"));

    const frameX = parseInt(frame.getAttribute("frameX") || 0);
    const frameY = parseInt(frame.getAttribute("frameY") || 0);
    const frameW = parseInt(frame.getAttribute("frameWidth") || fw);
    const frameH = parseInt(frame.getAttribute("frameHeight") || fh);

    const [ox, oy] = this.offsets[this.animName] || [0, 0];

    const drawX = this.pos[0] + ox - frameX * this.scale;
    const drawY = this.pos[1] + oy - frameY * this.scale;

    ctx.save();
    ctx.translate(drawX, drawY);
    if (this.flipX) ctx.scale(1, 1);

    ctx.drawImage(
      this.image,
      fx, fy, fw, fh,
      0, 0,
      frameW * this.scale, frameH * this.scale
    );

    ctx.restore();
  }
}
