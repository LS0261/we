export function addRatingSprite(ps, diff) {
  let type;
  if (diff <= 60) type = "sick";
  else if (diff <= 120) type = "good";
  else if (diff <= 180) type = "bad";
  else if (diff <= ps.hitWindow) type = "shit";
  //else type = "miss";
else {
  ps.misses++;
  ps.targetHealth = Math.max(0, ps.targetHealth - 0.5);
  return; // no agregamos sprite ni score
}

  ps.ratingsCount[type] = (ps.ratingsCount[type] || 0) + 1;

  if (type === "sick") ps.score += 350;
  else if (type === "good") ps.score += 200;
  else if (type === "bad") ps.score += 100;
  else if (type === "shit") ps.score += 50;

  if (type !== "miss" && window.NotesAssets?.ratingsImages?.[type]) {
    ps.ratingSprites.push({
      img: window.NotesAssets.ratingsImages[type],
      x: ps.W / 2 - 50,
      y: ps.H / 3,
      vy: -1.2,
      gravity: 0.05,
      alpha: 1,
      timer: 0,
    });
  }
}
