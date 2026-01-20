window.openPauseMenu = function(audioInst, onResume, playState) {
  const pauseOverlay = document.createElement("div");
  pauseOverlay.style.position = "fixed";
  pauseOverlay.style.top = 0;
  pauseOverlay.style.left = 0;
  pauseOverlay.style.width = "100%";
  pauseOverlay.style.height = "100%";
  pauseOverlay.style.background = "rgba(0, 0, 0, 0.7)";
  pauseOverlay.style.display = "flex";
  pauseOverlay.style.flexDirection = "column";
  pauseOverlay.style.justifyContent = "center";
  pauseOverlay.style.alignItems = "center";
  pauseOverlay.style.zIndex = 9999;
  pauseOverlay.style.color = "#fff";
  pauseOverlay.style.fontFamily = "sans-serif";

  const title = document.createElement("h2");
  title.textContent = "PAUSED";
  pauseOverlay.appendChild(title);

  // Resume
  const resumeBtn = document.createElement("button");
  resumeBtn.textContent = "RESUME";
  resumeBtn.style.fontSize = "24px";
  resumeBtn.style.margin = "10px";
  pauseOverlay.appendChild(resumeBtn);

  // Restart Song
  const restartBtn = document.createElement("button");
  restartBtn.textContent = "RESTART SONG";
  restartBtn.style.fontSize = "24px";
  restartBtn.style.margin = "10px";
  pauseOverlay.appendChild(restartBtn);

  // Botplay toggle
  const botplayBtn = document.createElement("button");
  botplayBtn.textContent = playState.botplay ? "BOTPLAY: ON" : "BOTPLAY: OFF";
  botplayBtn.style.fontSize = "24px";
  botplayBtn.style.margin = "10px";
  pauseOverlay.appendChild(botplayBtn);

  document.body.appendChild(pauseOverlay);

  audioInst.pause();

  // Resume action
  resumeBtn.onclick = () => {
    document.body.removeChild(pauseOverlay);
    audioInst.play();
    onResume();
  };

  // Restart action
  restartBtn.onclick = () => {
    document.body.removeChild(pauseOverlay);
    audioInst.pause();
    if (playState.currentSong) {
      playState.startPlay(playState.currentSong); // ⚠️ Asegúrate de guardar el nombre en startSong()
    }
  };

  // Botplay toggle
  botplayBtn.onclick = () => {
    playState.botplay = !playState.botplay;
    botplayBtn.textContent = playState.botplay ? "BOTPLAY: ON" : "BOTPLAY: OFF";
  };
};
