import NotesAssets from "./notes.js";

function drawGrid(ctx, cols, rowHeight, sectionLength, yOffset = 0, alpha = 1) {
  ctx.globalAlpha = alpha;
  for (let r = 0; r < sectionLength; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? "#9F9F9F" : "#3F3F3F";
      ctx.fillRect(c * (ctx.canvas.width/cols), yOffset + r * rowHeight, ctx.canvas.width/cols, rowHeight);
    }
  }
  ctx.globalAlpha = 1;
}

function drawHover(yOffset) {
  if (hoverCol < 0 || hoverCol >= cols || hoverRow < 0) return;

  const section = Math.floor(hoverRow / sectionLength);
  if (section !== scrollSection) return;

  const localRow = hoverRow % sectionLength;
  const x = hoverCol * colWidth;
  const y = yOffset + localRow * rowHeight;

  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  ctx.fillRect(x, y, colWidth, rowHeight);
}

// =====================
// Helper para calcular escala
// =====================
function getNoteScale(frame, colWidth, rowHeight) {
  if (!frame) return 1;
  const fw = parseInt(frame.getAttribute("width"));
  const fh = parseInt(frame.getAttribute("height"));
  const scaleX = colWidth / fw;
  const scaleY = rowHeight / fh;
  return Math.min(scaleX, scaleY); // mantiene proporción
}

// =====================
// Dibujar notas + sustains
// =====================
// =====================
// Helper para calcular escala
// =====================
function getNoteScale(frame, colWidth, rowHeight) {
  if (!frame) return 1;
  const fw = parseInt(frame.getAttribute("width"));
  const fh = parseInt(frame.getAttribute("height"));
  const scaleX = colWidth / fw;
  const scaleY = rowHeight / fh;
  return Math.min(scaleX, scaleY); // mantiene proporción
}

// Cuántos ms antes del playhead empiezan a verse las notas
const scrollWindow = 2000; // 2 segundos

function timeToY(strumTime, songTime) {
  let bpm = parseFloat(document.getElementById("songBpm").value || 120);
  let stepMs = (60000 / bpm) / 4; // ms por paso
  let speed = rowHeight / stepMs;  // px por ms
  let delta = strumTime - songTime; // ms
  return playheadY + delta * speed;
}

function drawNotes(alpha = 1) {
  if (!NotesAssets.imageLoaded || !NotesAssets.framesLoaded) return;

  let songTime = getPlayheadTimeMs();
  ctx.globalAlpha = alpha;
  let pulse = 0.5 + 0.5 * Math.sin(performance.now() / 200);

  for (let n of notes) {
    if (typeof n.strumTime !== "number") continue;

    // Filtrar solo notas visibles en la ventana de scroll
    if (n.strumTime < songTime - scrollWindow || n.strumTime > songTime + scrollWindow) continue;

    let noteY = timeToY(n.strumTime, songTime); // posición vertical relativa al playhead
    let noteX = n.col * colWidth;

    const baseFrame = NotesAssets.framesMapColored[n.col] || NotesAssets.framesMap[n.col];
    let scale = getNoteScale(baseFrame, colWidth, rowHeight);

    // Sustain
    if (n.sLen > 0) {
      let sustainHeight = (n.sLen / 1000) * (rowHeight * 4 * parseFloat(document.getElementById("songBpm").value) / 60);
      const startY = noteY + rowHeight / 2;

      const holdPiece = NotesAssets.holdPieces[n.col];
      if (holdPiece) {
        const pw = parseInt(holdPiece.getAttribute("width"));
        const ph = parseInt(holdPiece.getAttribute("height"));
        ctx.drawImage(
          NotesAssets.notesImage,
          parseInt(holdPiece.getAttribute("x")),
          parseInt(holdPiece.getAttribute("y")),
          pw, ph,
          noteX + (colWidth - pw*scale)/2,
          startY,
          pw*scale,
          sustainHeight - rowHeight/2
        );
      }

      const holdEnd = NotesAssets.holdEnds[n.col];
      if (holdEnd) {
        const ew = parseInt(holdEnd.getAttribute("width"));
        const eh = parseInt(holdEnd.getAttribute("height"));
        ctx.drawImage(
          NotesAssets.notesImage,
          parseInt(holdEnd.getAttribute("x")),
          parseInt(holdEnd.getAttribute("y")),
          ew, eh,
          noteX + (colWidth - ew*scale)/2,
          startY + sustainHeight - eh*scale,
          ew*scale,
          eh*scale
        );
      }
    }

    // Nota base
    if (baseFrame) {
      const fw = parseInt(baseFrame.getAttribute("width"));
      const fh = parseInt(baseFrame.getAttribute("height"));
      ctx.drawImage(
        NotesAssets.notesImage,
        parseInt(baseFrame.getAttribute("x")),
        parseInt(baseFrame.getAttribute("y")),
        fw, fh,
        noteX + (colWidth - fw*scale)/2,
        noteY - fh*scale/2 + rowHeight/2, // + rowHeight/2
        fw*scale,
        fh*scale
      );
    }

    // Nota seleccionada
    if (n === selectedNote) {
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.strokeRect(noteX, noteY - rowHeight/2, colWidth, rowHeight);
      ctx.globalAlpha = alpha;
    }
  }

  ctx.globalAlpha = 1;
}

function drawLabels(yOffset = 0) {
  ctx.fillStyle = "white";
  ctx.font = "18px vcr";
  ctx.textAlign = "center";

  // Cambiar el orden de las etiquetas para reflejar el cambio de columnas
  ctx.fillText("BF", colWidth * 2, yOffset + sectionLength * rowHeight - 8);  // Cambiar DAD -> BF
  ctx.fillText("DAD", colWidth * 6, yOffset + sectionLength * rowHeight - 8);  // Cambiar BF -> DAD

  ctx.textAlign = "left";
}
let x = 0;
let y = 150;
let speed = 2;

let playheadY = canvas.height * 0.3;  // 30% del alto, centrado

function drawPlayhead() {
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, playheadY);          // desde borde izquierdo
  ctx.lineTo(canvas.width, playheadY); // hasta borde derecho
  ctx.stroke();
}