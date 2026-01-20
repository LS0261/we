// sc/states/playstate_helpers/loadJSON.js
export async function loadJSON(path) {
  console.log(`[loadJSON] Intentando cargar: ${path}`);
  const res = await fetch(path);

  if (!res.ok) {
    console.error(`[loadJSON] Error al cargar ${path}: HTTP ${res.status}`);
    throw new Error(`No se pudo cargar ${path}`);
  }

  const json = await res.json();
  console.log(`[loadJSON] ✅ JSON cargado correctamente desde: ${path}`);
  return json;
}
