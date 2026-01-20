export function initRender(editor) {
  // Canvas
  let canvas = document.getElementById("chart");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "chart";
    canvas.width = 100;
    canvas.height = 100;
    canvas.style.border = "1px solid white";
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext("2d");

  const notes = editor.chart || [];
  const inst = editor.audioInst;

  const cols = 8;
  const colWidth = canvas.width / cols;
  const rowHeight = 50;
  const sectionLength = 16;
  const playheadY = canvas.height * 0.3;

  let hoverCol = -1;
  let hoverRow = -1;
  let scrollSection = 0;
  let playing = false;

  const hitSound = new Audio();

  // =====================
  // Funciones locales
  // =====================
  function drawGrid(yOffset = 0, alpha = 1) {
    ctx.globalAlpha = alpha;
    for (let r = 0; r < sectionLength; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? "#9F9F9F" : "#3F3F3F";
        ctx.fillRect(c * colWidth, yOffset + r * rowHeight, colWidth, rowHeight);
      }
    }
    ctx.globalAlpha = 1;
  }

  function getPlayheadTimeMs() {
    if (playing && inst) return inst.currentTime * 1000;
    return 0;
  }

  function playNotes(songTime) {
    for (let n of notes) {
      if (!n.played && n.strumTime <= songTime) {
        hitSound.currentTime = 0;
        hitSound.play().catch(() => {}); // evita errores si audio bloqueado
        n.played = true;
      }
      if (songTime < n.strumTime) n.played = false;
    }
  }

  function drawSimpleNotes() {
    for (let n of notes) {
      const y = playheadY - (n.row - scrollSection * sectionLength) * rowHeight;
      ctx.fillStyle = "red";
      ctx.fillRect(50 + n.col * 50, y - 10, 40, 20);
    }
  }

  function renderFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const songTime = getPlayheadTimeMs();
    playNotes(songTime);

    const bpm = parseFloat(document.getElementById("songBpm")?.value || 120);
    const stepMs = 60000 / bpm / 4;
    const row = songTime / stepMs;

    drawGrid(scrollSection * sectionLength);
    scrollSection = Math.floor(row / sectionLength);

    drawSimpleNotes();

    // Playhead
    ctx.strokeStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(0, playheadY);
    ctx.lineTo(canvas.width, playheadY);
    ctx.stroke();

    requestAnimationFrame(renderFrame);
  }

  renderFrame();

  // Intentar reproducir audio si existe
  if (inst) {
    inst.play().catch(() => {
      console.warn("Audio bloqueado o no cargado, reproducción ignorada");
    });
    playing = true;
  }
}
