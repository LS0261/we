import { BaseStage } from "../../backend/BaseStage.js";
import BGSpriteJS from "../../object/BGSpriteJS.js"; // Para los sprites estáticos
import { SpriteAnim } from "../../backend/SpriteAnim.js"; // Para los sprites animados
import Paths from "../../backend/Paths.js";

export class TheNothingWorld extends BaseStage {
  constructor(ps) {
    super(ps);
    this.members = [];
  }

  async create() {
    // Fondo estático
    this.bg('voidGradient', 'voidGradient', -1450, -1000, 0.5, false); // Agregar en fondo

    // Selever Pentagram (sprite animado)
    await this.addAnimatedSprite('seleverPentagram', 'seleverPentagram', -660, -600, 1, 0.8, false); // Agregar en fondo

    // Selever Sign (sprite estático)
    this.bg('seleverSign', 'seleverSign', -1020, -315, 1, true); // Agregar en primer plano

    // Selever Sign Fragments (sprite estático)
    this.bg('seleverSignFragments', 'seleverSignFragments', -940, 150, 1, true); // Agregar en primer plano
  }

  // Función para agregar un sprite estático
  bg(tag, file, x, y, scale, foreground = false) {
    const spriteObj = new BGSpriteJS(tag, x, y);
    spriteObj.loadGraphic(Paths.image(`images/stages/void/${file}`)); // Ruta ajustada a 'images/stages/void/'
    spriteObj.setGraphicSize(scale * 2.5);
    this.members.push(spriteObj);
    if (foreground) {
      this.add(spriteObj);  // Agregar al primer plano
    } else {
      this.add(spriteObj, false);  // Agregar al fondo
    }
  }

  // Función para agregar un sprite animado
  async addAnimatedSprite(tag, file, x, y, scale, alpha, foreground = false) {
    const spriteObj = new SpriteAnim(tag);
    await spriteObj.init({
      imageName: `images/stages/void/${file}`,  // Ruta ajustada para cargar desde "images/stages/void/"
      position: [x, y],
      scale: scale
    });

    spriteObj.alpha = alpha;

    this.members.push(spriteObj);
    if (foreground) {
      this.add(spriteObj);  // Agregar al primer plano
    } else {
      this.add(spriteObj, false);  // Agregar al fondo
    }
  }

  addAnimation(tag, anim, prefix, frameRate, loop) {
    const spriteObj = this.getSpriteByTag(tag);
    spriteObj.addAnim(anim, prefix, frameRate, loop);
  }

  playAnimation(tag, anim, loop) {
    const spriteObj = this.getSpriteByTag(tag);
    spriteObj.play(anim, loop);
  }

  setAlpha(tag, value) {
    const spriteObj = this.getSpriteByTag(tag);
    spriteObj.alpha = value;
  }

  onCreatePost() {
    this.setProperty('camGame.bgColor', '#FFFFFF');
  }

  setProperty(property, value) {
    if (property === 'camGame.bgColor') {
      this.ps.setBackgroundColor(value);
    }
  }

  onCountdownTick(count) {
    if (this.ps.songName.toLowerCase().includes('casanova')) {
      if (count === 3) {
        this.doTweenAngle('seleverPentagram', 360, 2);
        this.setAlpha('seleverPentagram', 1);
        this.playAnimation('dad', 'EYP', true);
        this.setProperty('dad.specialAnim', true);
        this.doTweenZoom('camGame', 1.3, 0.5, 'quadOut');
      }
    }
  }

  onSongStart() {
    if (this.ps.songName.toLowerCase().includes('casanova')) {
      this.doTweenAlpha('seleverPentagram', 0, 0.2);
    }
  }

  doTweenAngle(tag, angle, duration) {
    const spriteObj = this.getSpriteByTag(tag);
    spriteObj.doTweenAngle(angle, duration);
  }

  doTweenZoom(tag, zoom, duration, easing) {
    const spriteObj = this.getSpriteByTag(tag);
    spriteObj.doTweenZoom(zoom, duration, easing);
  }

  getSpriteByTag(tag) {
    return this.members.find(spr => spr.name === tag);
  }

  update(dt) {
    for (const spr of this.members) {
      if (spr.update) spr.update(dt);
    }
  }

  draw(ctx) {
    for (const spr of this.members) {
      if (spr.draw) spr.draw(ctx);
    }
  }
}
