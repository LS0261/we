// playstate_helpers/repositionHUD.js

export function repositionHUD(ps) {
  const { W, H, healthBar } = ps; 
  const barWidth = W * 0.6;
  const barHeight = 20;

  healthBar.barWidth = barWidth;
  healthBar.barHeight = barHeight;
  healthBar.x = (W - barWidth) / 2;
  healthBar.y = H - 50;
}
