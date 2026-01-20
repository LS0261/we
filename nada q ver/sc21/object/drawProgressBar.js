// sc/object/drawProgressBar.js
export function drawProgressBar(playState, ctxHUD) {
  if (!playState.audioInst || playState.audioInst.duration <= 0) return;

  const progress = playState.audioInst.currentTime / playState.audioInst.duration;

  const barWidth = playState.hudCanvas.width * 0.6;
  const barHeight = 12;
  const barX = (playState.hudCanvas.width - barWidth) / 2;
  const barY = playState.hudCanvas.height - 40;

  ctxHUD.fillStyle = "#333";
  ctxHUD.fillRect(barX, barY, barWidth, barHeight);

  ctxHUD.fillStyle = "#0f0";
  ctxHUD.fillRect(barX, barY, barWidth * progress, barHeight);

  ctxHUD.strokeStyle = "#fff";
  ctxHUD.strokeRect(barX, barY, barWidth, barHeight);
}