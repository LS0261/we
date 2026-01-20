export function initAudio(editor) {
  // Variables de audio internas
  let playing = false;
  let pausedTime = 0;
  const inst = document.getElementById("inst");      // coincide con tu HTML
  const voices = document.getElementById("voices");  // crea <audio id="voices"> si no existe

  if (!inst || !voices) {
    console.error("No se encontraron los elementos de audio en el DOM");
    return;
  }

  function getPlayheadTime() {
    let audioOffset = parseInt(document.getElementById("audioOffset").value) || 0;
    audioOffset /= 1000; // ms -> s

    if (playing) return inst.currentTime + audioOffset;
    else return pausedTime + audioOffset;
  }

  function togglePlayPause() {
    if (inst.readyState < 2) {
      document.getElementById("error").textContent = "Carga inst y voices primero";
      return;
    }
    if (!playing) {
      inst.play();
      voices.play();
      playing = true;
    } else {
      inst.pause();
      voices.pause();
      playing = false;
      pausedTime = inst.currentTime;
    }
  }

  // Conectar botones
  document.getElementById("play").onclick = togglePlayPause;
  document.getElementById("manualPlay").onclick = togglePlayPause;
  document.getElementById("stop").onclick = () => {
    inst.pause();
    voices.pause();
    playing = false;
    pausedTime = 0;
  };

  document.getElementById("instFile").onchange = e => {
    let f = e.target.files[0];
    if (f) inst.src = URL.createObjectURL(f);
    else inst.src = "Inst.ogg";
    inst.load();
  };

  document.getElementById("voicesFile").onchange = e => {
    let f = e.target.files[0];
    if (f) voices.src = URL.createObjectURL(f);
    voices.load();
  };

  // opcional: exponer getPlayheadTime si lo necesita ChartingState
  editor.getPlayheadTime = getPlayheadTime;
}
