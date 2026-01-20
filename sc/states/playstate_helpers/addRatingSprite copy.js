import FlxSpriteJS from "../../utils/FlxSpriteJS.js";

const RATING_SPRITES = {
  sick: "assets/images/ui/ratings/sick.png",
  good: "assets/images/ui/ratings/good.png",
  bad: "assets/images/ui/ratings/bad.png",
  shit: "assets/images/ui/ratings/shit.png"
};

// array global para que el juego pueda dibujar varios ratings
export const activeRatings = [];

export async function addRatingSprite(state, rating) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const playbackRate = 1;

  // ---------- RATING ----------
  const ratingSpr = new FlxSpriteJS();
  await ratingSpr.loadGraphic(RATING_SPRITES[rating.toLowerCase()]);
  ratingSpr.setGraphicSize(160);
  ratingSpr.updateHitbox();

  // ---------- COMBO ----------
  const comboSpr = new FlxSpriteJS();
  await comboSpr.loadGraphic("assets/images/ui/ratings/combo.png");
  comboSpr.setGraphicSize(120);
  comboSpr.updateHitbox();

  // Posición inicial
  let x = canvas.width / 2 - ratingSpr.width / 2;
  let y = canvas.height / 2 - 120;

  ratingSpr.pos = [x, y];
  comboSpr.pos = [x, y + ratingSpr.height + 8];

  // ---------- FÍSICA ----------
  let vx = -Math.random() * 10 * playbackRate;
  let vy = -(140 + Math.random() * 35) * playbackRate;
  const ay = 550 * playbackRate * playbackRate;

  let alpha = 1;

  const ratingObj = {
    update(dt) {
      vy += ay * dt;
      y += vy * dt;
      x += vx * dt;

      alpha = Math.max(
        0,
        1 - (y - (canvas.height / 2 - 120)) / 200
      );

      ratingSpr.pos[0] = x;
      ratingSpr.pos[1] = y;

      comboSpr.pos[0] = x;
      comboSpr.pos[1] = y + ratingSpr.height + 8;
    },

    draw() {
      ctx.save();
      ctx.globalAlpha = alpha;
      ratingSpr.draw(ctx);
      comboSpr.draw(ctx);
      ctx.restore();
    },

    get dead() {
      return alpha <= 0;
    }
  };

  activeRatings.push(ratingObj);
}
