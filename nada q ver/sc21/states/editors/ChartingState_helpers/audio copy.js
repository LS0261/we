// =======================
// audio.js
// Manejo de audio
// =======================

// Devuelve el tiempo (segundos) donde está la barra blanca
function getPlayheadTime() {
  let bpm = parseFloat(document.getElementById("songBpm").value || 120);
  let stepMs = (60000 / bpm) / 4;

  // fila global según la sección y la barra blanca
  let localRow = (playheadY - scrollOffset - rowHeight / 2) / rowHeight;
  let row = scrollSection * sectionLength + localRow;

  return Math.max(0, row * stepMs / 1000); // segundos
}

// -----------------------
// Controles de reproducción
// -----------------------
document.getElementById("play").onclick = () => {
  if (inst.readyState >= 2) {
    let bpm = parseFloat(document.getElementById("songBpm").value || 120);
    let stepMs = (60000 / bpm) / 4;

    // fila global en la que está la barra blanca
    let localRow = (playheadY - scrollOffset - rowHeight / 2) / rowHeight;
    
    let row = scrollSection * sectionLength + localRow;

    // tiempo en segundos donde debería empezar el audio
    let startSec = 0;

    // mover audios a ese punto
    inst.currentTime = startSec;
    voices.currentTime = startSec;

    // reproducir
    inst.play();
    voices.play();
    playing = true;

    // clave: recalcular startTime para que render quede alineado
    startTime = performance.now() - startSec * 1000;
  } else {
    document.getElementById("error").textContent = "Carga inst y voices primero";
  }
};

document.getElementById("stop").onclick = () => {
  inst.pause();
  voices.pause();
  playing = false;
};

// -----------------------
// Carga de archivos de audio
// -----------------------
document.getElementById("instFile").onchange = e => {
  let f = e.target.files[0];
  if (f) {
    inst.src = URL.createObjectURL(f);
  } else {
    inst.src = "Inst.ogg"; // fallback
  }
  inst.load();
};

document.getElementById("voicesFile").onchange = e => {
  let f = e.target.files[0];
  if (f) {
    voices.src = URL.createObjectURL(f);
    voices.load();
  }
};
