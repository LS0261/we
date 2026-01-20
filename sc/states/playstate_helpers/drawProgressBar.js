import { getProgress } from "./getProgress.js";

export function drawProgressBar(ps, ctx) {
  const progress = getProgress(ps);
  const barWidth = ps.W * 0.8;
  const barHeight = 20;
  const x = ps.W * 0.1;
  const y = 20;

  ctx.fillStyle = "#444";
  ctx.fillRect(x, y, barWidth, barHeight);

  ctx.fillStyle = "#0f0";
  ctx.fillRect(x, y, barWidth * progress, barHeight);

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barWidth, barHeight);
}
