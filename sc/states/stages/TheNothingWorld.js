import BGSpriteJS from "../../object/BGSpriteJS.js";

export class TheNothingWorld {
  /**
   * @param {PlayState} ps - referencia al PlayState
   * @param {Camera} camGame - la cámara principal
   */
  constructor(ps, camGame) {
    this.ps = ps;
    this.camGame = camGame; // guardamos la cámara
    this.members = [];
  }

  async create() {
    // Cambiar el fondo de la cámara desde la stage
    this.camGame.setBackground("#ffffff"); // fondo blanco

    // Crear sprites
    this.voidGradient = new BGSpriteJS("stages/void/voidGradient", -500, 0);
    this.voidGradient.setGraphicSize(2.5);
    this.voidGradient.scrollFactor = [0, 0];
    this.add(this.voidGradient);

    this.seleverSign = new BGSpriteJS("stages/void/seleverSign", 100, 500);
    this.seleverSign.setGraphicSize(2.5);
    this.seleverSign.updateHitbox();
    this.seleverSign.scrollFactor = [1, 1];
    this.add(this.seleverSign);

    this.seleverSignFragments = new BGSpriteJS("stages/void/seleverSignFragments", 100, 500);
    this.seleverSignFragments.setGraphicSize(2.5);
    this.seleverSignFragments.updateHitbox();
    this.seleverSignFragments.scrollFactor = [1, 1];
    this.add(this.seleverSignFragments);
  }

  add(sprite) {
    this.members.push(sprite);
  }

  update(dt) {
    for (const spr of this.members) {
      if (spr.update) spr.update(dt);
    }
  }

  draw(ctx, cam) {
    // Dibuja todos los sprites usando la cámara
    for (const spr of this.members) {
      if (spr.visible) {
        spr.draw(ctx, cam || { x: 0, y: 0 });
      }
    }
  }
}
