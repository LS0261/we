// sc/states/stages/StageWeek1.js
import { BaseStage } from "../../backend/BaseStage.js";
import FlxSpriteJS from "../../utils/FlxSpriteJS.js";
import Paths from "../../backend/Paths.js";

export class StageWeek1 extends BaseStage {
    constructor(ps) {
        super(ps);
        this.members = [];
    }

    async create() {
        // Fondo
        this.stageBack = new FlxSpriteJS(-600, -200);
        await this.stageBack.loadGraphic(Paths.image("stageback"));
        this.stageBack.setGraphicSize(Math.floor(this.stageBack.width * 0.9));
        this.members.push(this.stageBack);

        // Frente del stage
        this.stageFront = new FlxSpriteJS(-650, 600);
        await this.stageFront.loadGraphic(Paths.image("stagefront"));
        this.stageFront.setGraphicSize(Math.floor(this.stageFront.width * 1.1));
        this.stageFront.updateHitbox();
        this.members.push(this.stageFront);

        // Luces y cortinas (si no lowQuality)
        if (!this.ps.clientPrefs?.data?.lowQuality) {
            this.stageLight1 = new FlxSpriteJS(-125, -100);
            await this.stageLight1.loadGraphic(Paths.image("stage_light"));
            this.stageLight1.setGraphicSize(Math.floor(this.stageLight1.width * 1.1));
            this.members.push(this.stageLight1);

            this.stageLight2 = new FlxSpriteJS(1225, -100);
            await this.stageLight2.loadGraphic(Paths.image("stage_light"));
            this.stageLight2.setGraphicSize(Math.floor(this.stageLight2.width * 1.1));
            this.stageLight2.flipX = true;
            this.members.push(this.stageLight2);

            this.stageCurtains = new FlxSpriteJS(-500, -300);
            await this.stageCurtains.loadGraphic(Paths.image("stagecurtains"));
            this.stageCurtains.setGraphicSize(Math.floor(this.stageCurtains.width * 0.9));
            this.members.push(this.stageCurtains);
        }
    }

    // Para renderizar todos los sprites del stage
    draw(ctx) {
        for (const spr of this.members) {
            if (spr.visible) spr.draw(ctx);
        }
    }
}
