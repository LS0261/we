import { BaseStage } from "../../backend/BaseStage.js";
import BGSpriteJS from "../../object/BGSpriteJS.js";
import Paths from "../../backend/Paths.js";

export class StageWeek1 extends BaseStage {
  constructor(ps) {
    super(ps);
    this.members = [];
  }

  async create() {
    const scaleStage = 1; // Ajusta esto si quieres escalar todo el stage

    // --- Fondo ---
    this.stageBack = new BGSpriteJS("stageback", -600, -200);
    await this.stageBack.loadGraphic(Paths.image("stageback"));
    this.stageBack.setGraphicSize(Math.floor(this.stageBack.width * 0.9 * scaleStage));
    this.stageBack.scrollFactor = [0.9, 0.9]; // igual que Haxe
    this.add(this.stageBack);

    // --- Frente del stage ---
    this.stageFront = new BGSpriteJS("stagefront", -650, 600);
    await this.stageFront.loadGraphic(Paths.image("stagefront"));
    this.stageFront.setGraphicSize(Math.floor(this.stageFront.width * 1.1 * scaleStage));
    this.stageFront.updateHitbox();
    this.stageFront.scrollFactor = [0.9, 0.9];
    this.add(this.stageFront);

    // --- Luces y cortinas ---
    if (!this.ps.clientPrefs?.data?.lowQuality) {
      this.stageLight1 = new BGSpriteJS("stage_light", -125, -100);
      await this.stageLight1.loadGraphic(Paths.image("stage_light"));
      this.stageLight1.setGraphicSize(Math.floor(this.stageLight1.width * 1.1 * scaleStage));
      this.stageLight1.scrollFactor = [0.9, 0.9];
      this.add(this.stageLight1);

      this.stageLight2 = new BGSpriteJS("stage_light", 1225, -100);
      await this.stageLight2.loadGraphic(Paths.image("stage_light"));
      this.stageLight2.setGraphicSize(Math.floor(this.stageLight2.width * 1.1 * scaleStage));
      this.stageLight2.scrollFactor = [0.9, 0.9];
      this.stageLight2.flipX = true;
      this.add(this.stageLight2);

      this.stageCurtains = new BGSpriteJS("stagecurtains", -500, -300);
      await this.stageCurtains.loadGraphic(Paths.image("stagecurtains"));
      this.stageCurtains.setGraphicSize(Math.floor(this.stageCurtains.width * 0.9 * scaleStage));
      this.stageCurtains.scrollFactor = [1, 1];
      this.add(this.stageCurtains);
    }
  }

  update(dt) {
    // Actualizamos todos los sprites
    for (const spr of this.members) {
      if (spr.update) spr.update(dt);
    }
  }

  draw(ctx, cam) {
    // Dibujamos todos los sprites con la cámara
    for (const spr of this.members) {
      if (spr.visible) {
        spr.draw(ctx, cam || { x: 0, y: 0 });
      }
    }
  }
}
