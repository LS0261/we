export function bindInputs(playState) {
  if (!playState.keys) {
    playState.keys = {};  // Inicializa keys si no existe
  }

  window.addEventListener("keydown", e => {
    playState.keys[e.key] = true;
  });

  window.addEventListener("keyup", e => {
    playState.keys[e.key] = false;
  });
}
