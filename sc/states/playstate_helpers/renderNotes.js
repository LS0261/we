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

    const dirs = ["purple", "blue", "green", "red"];
    const startNames = ["purple note", "blue note", "green note", "red note"];
    const pieceNames = ["purple hold piece", "blue hold piece", "green hold piece", "red hold piece"];
    const endNames = ["purple hold end", "blue hold end", "green hold end", "red hold end"];

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

        // === Sustain (head + body + end) ===
if (note.sustain > 0) {
    let holdVisibleStartTime = note.time;

    if (isPlayer) {
        const isHeld = playState.lanesHeld[note.lane]?.holdNote === note;
        if (isHeld) holdVisibleStartTime = Math.max(note.time, songPos);
    }

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
        note.time + note.sustain,
        songPos,
        receptorY,
        upwards,
        playState.baseDistance,
        playState.songBpm,
        playState.scrollSpeed
    );

    const progress = note.displayProgress ?? 1;
    const yEndAdjusted = yEnd - (yEnd - yStartHold) * (1 - progress);

    // === Frames ===
    const startFrame = NoteAtlas.atlasFrames[NoteAtlas.frames[startNames[laneIndex]]?.[0]];
    const pieceFrame = NoteAtlas.atlasFrames[NoteAtlas.frames[pieceNames[laneIndex]]?.[0]];
    const endFrame = NoteAtlas.atlasFrames[NoteAtlas.frames[endNames[laneIndex]]?.[0]];

    if (!startFrame || !pieceFrame || !endFrame) return;

    // === Escala ÚNICA para todo ===
    const scale = holdWidth / pieceFrame.frameWidth;
    const drawX = x + (size - holdWidth) / 2;

    let offsetY = yStartHold;

    offsetY += startFrame.frameHeight * scale;

    // --- BODY (tile) ---
    const pieceHeight = pieceFrame.frameHeight * scale;
    while (offsetY + pieceHeight <= yEndAdjusted) {
        ctxHUD.drawImage(
            NoteAtlas.image,
            pieceFrame.x, pieceFrame.y, pieceFrame.width, pieceFrame.height,
            drawX, offsetY,
            pieceFrame.frameWidth * scale,
            pieceHeight
        );
        offsetY += pieceHeight;
    }

    // --- END ---
    const endHeight = endFrame.frameHeight * scale;
    ctxHUD.drawImage(
        NoteAtlas.image,
        endFrame.x, endFrame.y, endFrame.width, endFrame.height,
        drawX, yEndAdjusted - endHeight,
        endFrame.frameWidth * scale,
        endHeight
    );
}

        // === Cabeza de nota normal ===
        if (!note.hit && note.time >= songPos - playState.scrollDuration) {
            const frameName = NoteAtlas.frames[startNames[laneIndex]]?.[0];
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

        // === Limpiar notas Player (opcional si se pasó) ===
        if (isPlayer && note.hit && songPos >= note.time + note.sustain) {
            notes.splice(i, 1);
            playState.notesPassed++;
        }
    }
}
