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

    this.positionArray = [0, 0];
    this.cameraPosition = [0, 0];  // Esta será la que invertiremos
    this.scale = 1;

    this.isGF = false;
    this.specialAnim = null;
    this.specialAnimTime = 0;

    this.animOffsets = {};
  }

  async init(options = {}) {
    const res = await fetch(Paths.json(`characters/${this.name}`));
    this.data = await res.json();

    // posición prioridad: options.position > JSON del personaje > [0,0]
    this.positionArray = options.position || this.data.position || [0,0];
    this.cameraPosition = this.data.camera_position || [0, 0];
    this.scale = this.data.scale || 1;
    this.isGF = this.data.type === "gf";

    await super.init({
      imageName: this.data.image,
      position: [...this.positionArray], // Aquí toma la posición correcta
      scale: this.scale,
    });
    this.x = this.positionArray[0];
    this.y = this.positionArray[1];

    // Invertir las posiciones de cámara
    this.cameraPosition = [-this.cameraPosition[0], -this.cameraPosition[1]];

    for (let anim of this.data.animations) {
      let [ox, oy] = anim.offsets || [0, 0];
      ox = -ox;
      oy = -oy;
      this.addAnim(anim.anim, anim.name, anim.fps, anim.loop, [ox, oy], anim.indices || null);
    }

    this.healthIcon = this.data.healthicon || this.name;

    this.playAnim("idle");
  }

  updatePosition() {
    // Cambiar pos[0] y pos[1] por x y y
    this.x = this.positionArray[0];
    this.y = this.positionArray[1];
    this.flipX = this.isPlayer ? !this.data.flip_x : this.data.flip_x;
  }

playAnim(animName, isSpecial = false, beatLength = 0.5) {
  if (!this.frames[animName]) return;

  // Reproduce la animación normalmente.
  this.curAnim = this.play(animName, true);
  this.updatePosition();

  if (isSpecial) {
    this.specialAnim = animName;
    this.specialAnimTime = (this.data.sing_duration * 0.38 || 0.02) * beatLength;
  } else {
    this.specialAnim = null;
  }

  // Si la animación es "idle", le asignamos que pase a "idle-loop" cuando termine
  if (animName === "idle") {
    this.specialAnimTime = -1;  // Esto indica que el ciclo de "idle-loop" comenzará después de que "idle" termine.
  }
}

  stopSinging() {
    this.specialAnim = null;
    this.specialAnimTime = 0;
    this.setIdle();
  }

  setIdle() {
    if (this.curAnim && this.curAnim.name.endsWith("-loop")) return;
    if (this.frames["idle"]) this.playAnim("idle");
  }

update(delta) {
  super.update(delta);

  // Control de duración para animaciones especiales
  if (this.specialAnim) {
    if (this.specialAnimTime > 0) {
      this.specialAnimTime -= delta;
      if (this.specialAnimTime <= 0) {
        this.stopSinging();
      }
    } else if (this.specialAnimTime === -1) {
      // Mantener animación loop activa
      if (!this.isAnimationPlaying(this.specialAnim)) {
        this.play(this.specialAnim, true);  // Reproducir la animación en bucle
      }
    }
  }

  // 🔁 Cambio automático de "idle" -> "idle-loop"
  if (this.isAnimationFinished()) {
    if (
      this.curAnim &&
      this.curAnim.name === "idle"  // Si la animación es "idle", pasamos a "idle-loop"
    ) {
      const loopAnimName = "idle-loop";  // Aquí se pasa a la animación loop
      if (this.frames[loopAnimName]) {
        this.playAnim(loopAnimName);  // Cambiar a la animación loop
        this.specialAnim = loopAnimName;
        this.specialAnimTime = -1;    // Esto indica que el loop continuará hasta que se cambie a otra animación
      }
    }
  }
}

  onBeat(beatLength = 0.5) {
    if (!this.specialAnim) {
      if (this.isGF) {
        this.gfDanceState = this.gfDanceState === "danceLEFT" ? "danceRIGHT" : "danceLEFT";
        this.playAnim(this.gfDanceState);
      } else {
        this.setIdle();
      }
    }
  }

  isAnimationFinished() {
    return this.curAnim && this.curAnim.finished;
  }

  getMidpoint() {
    return [this.x + this.width / 2, this.y + this.height / 2];
  }

  getCameraPosition() {
    // Invertir la posición de la cámara
    return [-this.x - this.cameraPosition[0], -this.y - this.cameraPosition[1]];
  }

  isAnimationPlaying(names) {
    if (!this.curAnim) return false;
    if (Array.isArray(names)) {
      return names.includes(this.curAnim.name);
    }
    return this.curAnim.name === names;
  }
}
