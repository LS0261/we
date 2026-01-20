//setupButtons.js
import { startCountdown } from "./countdown.js";

export function setupButtons(playStateInstance) {
  const playBtn = document.createElement("button");
  playBtn.textContent = "▶ PLAY";
  Object.assign(playBtn.style, {
    position: "fixed",
    bottom: "50%",
    left: "50%",
    transform: "translate(-50%, 0)",
    fontSize: "30px",
    padding: "10px 30px",
    display: "none",
    zIndex: "1000",
  });
  document.body.appendChild(playBtn);

playBtn.onclick = () => {
  playBtn.disabled = true;

  startCountdown(playStateInstance, () => {
    if (playStateInstance.audioInst) {
      playStateInstance.audioInst.currentTime = 0;
      playStateInstance.audioInst.play().then(() => {
        console.log("▶ Instrumental reproduciéndose");
      }).catch((err) => {
        console.warn("❌ No se pudo reproducir instrumental:", err);
      });
    }

    if (playStateInstance.audioVoices) {
      playStateInstance.audioVoices.currentTime = 0;
      playStateInstance.audioVoices.play().then(() => {
        console.log("🎤 Voices reproduciéndose");
      }).catch((err) => {
        console.warn("⚠ No se pudo reproducir voices:", err);
      });
    }

    playStateInstance.playing = true;
    playBtn.style.display = "none";
    pauseBtn.style.display = "block";
  });
};

  const pauseBtn = document.createElement("img");
  pauseBtn.src = "images/pause.png";
  Object.assign(pauseBtn.style, {
    position: "fixed",
    top: "10px",
    right: "10px",
    width: "99px",
    height: "93px",
    cursor: "pointer",
    zIndex: "1000",
    display: "none",
  });
  document.body.appendChild(pauseBtn);

  pauseBtn.onclick = () => {
    playStateInstance.playing = false;
    // Si tienes openPauseMenu, lo puedes agregar aquí
    pauseBtn.style.display = "none";
  };

  playStateInstance.playBtn = playBtn;
  playStateInstance.pauseBtn = pauseBtn;
}
