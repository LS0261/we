// sc/render/renderStrums.js
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
    if (isPlayer) {
      if (laneState.state === "press") anim = `${dirName} press`;
      else if (laneState.state === "confirm") anim = `${dirName} confirm`;
    }

    // --- Tomar frame según frameIdx ---
    const frames = NoteAtlas.frames[anim];
    if (!frames) continue;

    const frameName = frames[laneState.frameIdx % frames.length];
    const frame = NoteAtlas.atlasFrames[frameName];
    if (!frame) continue;

    // Escalar correctamente según size
    const scale = size / frame.frameWidth;

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

    // Avanzar timer y frame interno
    if (isPlayer && laneState.timer > 0) {
      laneState.timer--;
      if (laneState.timer % 3 === 0) laneState.frameIdx++;
      if (laneState.timer === 0) {
        laneState.state = "idle";
        laneState.frameIdx = 0;
      }
    }
  }
}
