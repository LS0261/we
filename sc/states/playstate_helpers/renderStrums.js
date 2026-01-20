import { NotesAssetsPromise } from "../../object/notes.js";

let NoteAtlas = null;

// Inicializar atlas global una sola vez
(async () => {
  NoteAtlas = await NotesAssetsPromise;
})();

export function renderStrums(
  playState,
  ctxHUD,
  y,
  size,
  startX,
  spacing,
  laneStates,
  isPlayer,
  delta
) {
  if (!NoteAtlas || !NoteAtlas.loaded) return;

  const dirs = ["purple", "blue", "green", "red"];

  for (let i = 0; i < 4; i++) {
    const laneState = laneStates[i];
    const x = startX + i * spacing;
    const dirName = dirs[i];

    // Determinar animación según estado
    let anim = dirName; // idle por defecto
    if (laneState.state === "confirm") {
      anim = `${dirName} confirm`; // flash corto
    } else if (laneState.state === "press") {
      anim = `${dirName} press`; // mientras se mantiene presionada
    }

    // --- Tomar frame según frameIdx ---
    const frames = NoteAtlas.frames[anim];
    if (!frames) continue;

    const frameName = frames[laneState.frameIdx % frames.length];
    const frame = NoteAtlas.atlasFrames[frameName];
    if (!frame) continue;

    // Escalar correctamente según size
    const scale = 0.7;

    // Dibujar frame en el HUD
    ctxHUD.drawImage(
      NoteAtlas.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      x,
      y,
      frame.frameWidth * scale,
      frame.frameHeight * scale
    );

    // Avanzar frame interno (solo para animaciones con timer)
    if (laneState.timer !== Infinity && laneState.timer > 0) {
      laneState.timer--;
      if (laneState.timer % 3 === 0) laneState.frameIdx++;
      if (laneState.timer === 0) {
        laneState.state = "idle";
        laneState.frameIdx = 0;
      }
    } else if (laneState.state === "press") {
      // Avanzar frames mientras la tecla esté sostenida
      laneState.frameIdx++;
    }
  }
}
