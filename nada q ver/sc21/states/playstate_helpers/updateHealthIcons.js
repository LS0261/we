import { clamp } from "./clamp.js";

export function updateHealthIcons(ps) {
  const healthPercent = clamp(ps.playerHealth / ps.playerMaxHealth, 0, 1);
  const barX = ps.healthBar.x + ps.healthBar.barOffset.x;
  const barY = ps.healthBar.y + ps.healthBar.barOffset.y;
  const barW = ps.healthBar.barWidth;
  const iconW = ps.iconP1.width || 75;
  const iconH = ps.iconP1.height || 75;
  const iconY = barY - 40;

  const clampX = (x) => Math.max(barX, Math.min(x, barX + barW - iconW));

  const p1X = clampX(barX + (1 - healthPercent) * barW);
  const p2X = clampX(barX + healthPercent * barW);

  ps.iconP1.x = p1X;
  ps.iconP2.x = p2X;
  ps.iconP1.y = iconY;
  ps.iconP2.y = iconY;
}
