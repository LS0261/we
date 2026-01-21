// sc/loader.js
export async function loadState(stateLoader, onProgress) {
  // onProgress: callback para porcentaje de carga
  let progress = 0;
  onProgress?.(progress);

  // Aquí podrías dividir la carga en pasos si quieres barra real
  await stateLoader(); // espera a que el estado se cargue

  progress = 1;
  onProgress?.(progress);
}
