// sc/object/stages/stage.js
import { Character } from "../../object/character.js";

export class Stage {
    constructor(ps) {
        this.ps = ps;
        this.backgroundColor = "#ffffff"; // fondo blanco de prueba
    }

    draw(ctx) {
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}
