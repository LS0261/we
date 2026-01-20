// sc/object/character.js
import { SpriteAnim } from "../backend/SpriteAnim.js";
import Paths from "../backend/Paths.js";

export class Character extends SpriteAnim {
  constructor(name, isPlayer = false) {
    super(name);
    this.isPlayer = isPlayer;

    this.specialAnim = null;       // animación de canto activa
    this.specialAnimTime = 0;      // tiempo restante de la animación
    this.healthIcon = null;        // ícono de vida
    this.data = null;              // datos cargados del JSON
    this.offset = [0, 0];          // offset actual aplicado al sprite
    this.positionArray = [0, 0];   // posición base del personaje
    this.cameraPosition = [0, 0];  // posición relativa a la cámara
  }

  async init() {
    // Cargar JSON del personaje
    const res = await fetch(Paths.json(`characters/${this.name}`));
    this.data = await res.json();

    // Guardar posición base y posición de cámara
    this.positionArray = this.data.position || [0, 0];
    this.cameraPosition = this.data.camera_position || [0, 0];

    // Inicializar sprite con SpriteAnim
    await super.init({
      imageName: this.data.image,
      position: [...this.positionArray],
      scale: this.data.scale || 1,
      flipX: this.data.flip_x || false
    });

    // Agregar animaciones según JSON, manteniendo offsets
    for (let anim of this.data.animations) {
      let [ox, oy] = anim.offsets || [0, 0];
      this.addAnim(
        anim.anim,
        anim.name,
        anim.fps,
        anim.loop,
        [ox, oy],
        anim.indices || null
      );
    }

    // Animación por defecto: idle
    if (this.frames["idle"]) {
      this.play("idle");
      const idleData = this.data.animations.find(a => a.anim === "idle");
      this.offset = idleData?.offsets ? [...idleData.offsets] : [0, 0];
    }

    // Ícono de vida
    this.healthIcon = this.data.healthicon || this.name;
  }

  // Cambiar animación de canto y aplicar offsets dinámicamente
  playAnim(animName, isSpecial = false, beatLength = 0.5) {
    if (!this.frames[animName]) return;

    this.play(animName, true);

    // Aplicar offset de la animación
    const animData = this.data.animations.find(a => a.anim === animName);
    this.offset = animData?.offsets ? [...animData.offsets] : [0, 0];

    if (isSpecial) {
      this.specialAnim = animName;
      const beatsMultiplier = animData?.sing_duration ?? 1;
      this.specialAnimTime = beatsMultiplier * beatLength;
    }
  }

  update(delta) {
    super.update(delta);

    // Reducir tiempo de animación especial
    if (this.specialAnim) {
      this.specialAnimTime -= delta;
      if (this.specialAnimTime <= 0) {
        this.specialAnim = null;
        this.specialAnimTime = 0;

        // Volver a idle con offset
        if (this.frames["idle"]) {
          this.play("idle");
          const idleData = this.data.animations.find(a => a.anim === "idle");
          this.offset = idleData?.offsets ? [...idleData.offsets] : [0, 0];
        }
      }
    }
  }

  // Se llama en cada beat desde PlayState
  onBeat() {
    if (!this.specialAnim && !this.animName.startsWith("sing")) {
      this.play("idle");
      const idleData = this.data.animations.find(a => a.anim === "idle");
      this.offset = idleData?.offsets ? [...idleData.offsets] : [0, 0];
    }
  }

  // Obtener posición visual considerando offsets y cámara
  getDrawPosition() {
    return [
      this.positionArray[0] + this.offset[0] + this.cameraPosition[0],
      this.positionArray[1] + this.offset[1] + this.cameraPosition[1]
    ];
  }
  
// Posición real del sprite en pantalla
getSpritePosition() {
  return [
    this.positionArray[0] + this.offset[0],
    this.positionArray[1] + this.offset[1]
  ];
}

getCameraPosition() {
  return [
    this.x + this.cameraPosition[0],
    this.y + this.cameraPosition[1]
  ];
}
getMidpoint() {
  return [
    this.x + this.width / 2,
    this.y + this.height / 2
  ];
}
}
