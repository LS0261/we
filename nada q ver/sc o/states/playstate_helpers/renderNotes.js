// sc/render/renderNotes.js
import { NotesAssetsPromise } from "../../object/notes.js";
import { calculateNoteY } from "./calculateNoteY.js";

let NoteAtlas = null;

// Cargar atlas global una sola vez
(async () => {
  NoteAtlas = await NotesAssetsPromise;
})();

export function renderNotes(
  playState,
  ctxHUD,
  notes,
  isPlayer,
  startX,
  spacing,
  size,
  holdWidth,
  receptorY,
  songPos,
  upwards
) {
  if (!NoteAtlas || !NoteAtlas.loaded) return;

  for (let i = notes.length - 1; i >= 0; i--) {
    const note = notes[i];
    const lane = isPlayer ? note.lane - 4 : note.lane;
    const x = startX + lane * spacing;
    const laneIndex = lane % 4;

    const yStart = calculateNoteY(note, songPos, receptorY, upwards, playState.baseDistance, playState.scrollDuration);

    // === Sustain (barra larga) ===
    if (note.sustain > 0) {
      if (songPos > note.time + note.sustain + 100) continue;

      let holdVisibleStartTime = note.time;
      const isBeingHeld =
        isPlayer && playState.lanesHeld[note.lane - 4]?.holdNote === note;
      if (isBeingHeld) holdVisibleStartTime = Math.max(note.time, songPos);

      const sustainEndTime = note.time + note.sustain;

const yStartHold = calculateNoteY(
    { time: holdVisibleStartTime },
    songPos,
    receptorY,
    upwards,
    playState.baseDistance,
    playState.scrollDuration
);
const yEnd = calculateNoteY(
    { time: sustainEndTime },
    songPos,
    receptorY,
    upwards,
    playState.baseDistance,
    playState.scrollDuration
);

      const bodyHeight = Math.abs(yEnd - yStartHold);
      const bodyY = Math.min(yStartHold, yEnd) + size / 2;

      ctxHUD.fillStyle = "rgba(255, 255, 0, 0.6)";
      ctxHUD.fillRect(
        x + (size - holdWidth) / 2,
        bodyY,
        holdWidth,
        bodyHeight
      );

      if (songPos >= note.time && songPos <= note.time + note.sustain) {
        ctxHUD.fillStyle = "rgba(255, 200, 0, 0.9)";
        ctxHUD.fillRect(
          x + (size - holdWidth) / 2,
          yEnd,
          holdWidth,
          size / 2
        );
      }
    }

    // === Cabeza de la nota ===
    if (!note.hit && note.time >= songPos - playState.scrollDuration) {
      const animNames = ["purple note", "blue note", "green note", "red note"];
      const anim = animNames[laneIndex];

const frameName = NoteAtlas.frames[anim]?.[0];
const frame = NoteAtlas.atlasFrames[frameName];
if (!frame) continue;

// usar frameWidth y frameHeight reales
const scale = size / frame.frameWidth;

ctxHUD.drawImage(
  NoteAtlas.image,
  frame.x,
  frame.y,
  frame.width,
  frame.height,
  x,
  yStart,
  frame.frameWidth * scale,
  frame.frameHeight * scale
);
    }

    // === Eliminar notas del oponente automáticamente ===
    if (!isPlayer && songPos >= note.time) {
      notes.splice(i, 1);
      playState.notesPassed++;
    }
  }
}
