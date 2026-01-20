export function drawStrumline(ps, ctx) {
  const receptorY = ps.H - 150;
  const receptorX = ps.W / 2 - 200;

  for (let i = 0; i < 4; i++) {
    const x = receptorX + i * 100;
    const y = receptorY;

    ctx.fillStyle = "white";
    ctx.fillRect(x - 25, y - 25, 50, 50);

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(ps.laneDirs[i], x - 20, y + 40);
  }
}
