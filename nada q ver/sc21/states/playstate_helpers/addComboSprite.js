// sc/playstate_helpers/addComboSprite.js
export function addComboSprite(state, combo) {
  if (!window.NotesAssets?.comboNums) return;

  const digits = combo.toString().split("");
  const startX = state.W / 2 - (digits.length * 30) / 2; // centrar
  const startY = state.H / 2 + 100;

  digits.forEach((d, i) => {
    const img = window.NotesAssets.comboNums[d];
    if (!img) return;

    state.ratingSprites.push({
      img,
      x: startX + i * 30,
      y: startY,
      vy: -1.5,
      gravity: 0.05,
      alpha: 1,
      timer: 0,
    });
  });
}
