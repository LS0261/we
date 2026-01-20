// sc/object/character.js
import { SpriteAnim } from "../backend/SpriteAnim.js";
import Paths from "../backend/Paths.js";

export class Character extends SpriteAnim {
  constructor(name, isPlayer = false) {
    super(name);

    this.name = name;
    this.isPlayer = isPlayer;

    this.data = null;
    this.healthIcon = null;

    this.positionArray = [0, 0];   // posición base (se setea en startCharacterPos)
    this.cameraPosition = [0, 0];  // offset para cámara
    this.scale = 1;

    this.isGF = false;
    this.specialAnim = null;
    this.specialAnimTime = 0;

    this.animOffsets = {}; // offsets por animación
  }

  async init() {
    // cargar JSON del personaje
    const res = await fetch(Paths.json(`characters/${this.name}`));
    this.data = await res.json();

    this.positionArray = this.data.position || [0, 0];
    this.cameraPosition = this.data.camera_position || [0, 0];
    this.scale = this.data.scale || 1;
    this.isGF = this.data.type === "gf";

    // inicializar sprite
    await super.init({
      imageName: this.data.image,
      position: [...this.positionArray],
      scale: this.scale,
    });

    // registrar animaciones
    for (let anim of this.data.animations) {
      let [ox, oy] = anim.offsets || [0, 0];
        ox = -ox;
        oy = -oy;
      this.addAnim(anim.anim, anim.name, anim.fps, anim.loop, [ox, oy], anim.indices || null);
    }

    // ícono
    this.healthIcon = this.data.healthicon || this.name;

    // idle por defecto
    this.playAnim("idle");
  }
updatePosition() {
  // posición base del personaje
  this.pos[0] = this.positionArray[0];
  this.pos[1] = this.positionArray[1];

  // flipX como Psych Engine
  this.flipX = this.isPlayer ? !this.data.flip_x : this.data.flip_x;
}

playAnim(animName, isSpecial = false, beatLength = 0.5) {
  if (!this.frames[animName]) return;

  this.curAnim = animName;
  this.play(animName, true);

  this.updatePosition(); // ✅ usa la misma lógica de posicionamiento

  if (isSpecial) {
    this.specialAnim = animName;
    this.specialAnimTime = (this.data.sing_duration || 2) * beatLength;
  }
}

  setIdle() {
    if (this.frames["idle"]) this.playAnim("idle");
  }

  update(delta) {
    super.update(delta);

    if (this.specialAnim) {
      this.specialAnimTime -= delta;
      if (this.specialAnimTime <= 0) {
        this.specialAnim = null;
        this.specialAnimTime = 0;
        this.setIdle();
      }
    }
  }

  onBeat(beatLength = 0.5) {
    if (!this.specialAnim) {
      if (this.isGF) {
        // gf alterna danceLEFT / danceRIGHT
        this.gfDanceState = this.gfDanceState === "danceLEFT" ? "danceRIGHT" : "danceLEFT";
        this.playAnim(this.gfDanceState);
      } else {
        this.setIdle();
      }
    }
  }

  getMidpoint() {
    return [this.x + this.width / 2, this.y + this.height / 2];
  }

  getCameraPosition() {
    return [this.x + this.cameraPosition[0], this.y + this.cameraPosition[1]];
  }
  isAnimationPlaying(names) {
    if (!this.curAnim) return false;
    if (Array.isArray(names)) {
        return names.includes(this.curAnim.name);
    }
    return this.curAnim.name === names;
}

}
