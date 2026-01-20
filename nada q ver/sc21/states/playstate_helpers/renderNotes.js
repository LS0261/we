// sc/render/renderNotes.js
import { NotesAssetsPromise } from "../../object/notes.js";
import { calculateNoteY } from "./calculateNoteY.js";

let NoteAtlas = null;
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
    const laneIndex = note.lane % 4;
    const x = startX + laneIndex * spacing;

    const yStart = calculateNoteY(
      note.time,
      songPos,
      receptorY,
      upwards,
      playState.baseDistance,
      playState.songBpm,
      playState.scrollSpeed
    );

    // === Sustain estilo FNF PE ===
    if (note.sustain > 0 && songPos <= note.time + note.sustain + 100) {
      let holdVisibleStartTime = note.time;
      if (isPlayer) {
        const isBeingHeld = playState.lanesHeld[note.lane]?.holdNote === note;
        if (isBeingHeld) holdVisibleStartTime = Math.max(note.time, songPos);
      }

      const sustainEndTime = note.time + note.sustain;
      const yStartHold = calculateNoteY(
        holdVisibleStartTime,
        songPos,
        receptorY,
        upwards,
        playState.baseDistance,
        playState.songBpm,
        playState.scrollSpeed
      );
      const yEnd = calculateNoteY(
        sustainEndTime,
        songPos,
        receptorY,
        upwards,
        playState.baseDistance,
        playState.songBpm,
        playState.scrollSpeed
      );

      const pieceNames = ["purple hold piece", "blue hold piece", "green hold piece", "red hold piece"];
      const startNames = ["purple note", "blue note", "green note", "red note"];
      const endNames = ["purple hold end", "blue hold end", "green hold end", "red hold end"];

      // --- Cabeza inicial ---
      const startFrameName = NoteAtlas.frames[startNames[laneIndex]]?.[0];
      const startFrame = NoteAtlas.atlasFrames[startFrameName];
      let offsetY = yStartHold;
      if (startFrame) {
        const scale = size / startFrame.frameWidth;
        ctxHUD.drawImage(
          NoteAtlas.image,
          startFrame.x,
          startFrame.y,
          startFrame.width,
          startFrame.height,
          x,
          offsetY,
          startFrame.frameWidth * scale,
          startFrame.frameHeight * scale
        );
        offsetY += startFrame.frameHeight * scale;
      }

      // --- Cuerpo del sustain (tile) ---
      const pieceFrameName = NoteAtlas.frames[pieceNames[laneIndex]]?.[0];
      const pieceFrame = NoteAtlas.atlasFrames[pieceFrameName];
      if (pieceFrame) {
        const scaleX = holdWidth / pieceFrame.frameWidth;
        const pieceHeight = pieceFrame.frameHeight * scaleX;
        while (offsetY + pieceHeight < yEnd) {
          ctxHUD.drawImage(
            NoteAtlas.image,
            pieceFrame.x,
            pieceFrame.y,
            pieceFrame.width,
            pieceFrame.height,
            x + (size - holdWidth) / 2,
            offsetY,
            pieceFrame.frameWidth * scaleX,
            pieceHeight
          );
          offsetY += pieceHeight;
        }
      }

      // --- Cabeza final (alineada a yEnd) ---
      const endFrameName = NoteAtlas.frames[endNames[laneIndex]]?.[0];
      const endFrame = NoteAtlas.atlasFrames[endFrameName];
      if (endFrame) {
        ctxHUD.drawImage(
          NoteAtlas.image,
          endFrame.x,
          endFrame.y,
          endFrame.width,
          endFrame.height,
          x,
          yEnd, // como FNF PE
          endFrame.width,
          endFrame.height
        );
      }
    }

    // === Cabeza de nota normal ===
    if (!note.hit && note.time >= songPos - playState.scrollDuration) {
      const animNames = ["purple note", "blue note", "green note", "red note"];
      const frameName = NoteAtlas.frames[animNames[laneIndex]]?.[0];
      const frame = NoteAtlas.atlasFrames[frameName];
      if (!frame) continue;

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

    // === Limpiar notas del oponente ===
    if (!isPlayer && songPos >= note.time + note.sustain) {
      notes.splice(i, 1);
      playState.notesPassed++;
    }
  }
}
