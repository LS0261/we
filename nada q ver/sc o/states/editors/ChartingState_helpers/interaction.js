// interaction.js (modular)
export function initInteraction(editor) {
  const canvas = document.getElementById("chartCanvas");
  if (!canvas) return;

  let hoverCol = -1;
  let hoverRow = -1;
  let selectedNote = null;

  canvas.addEventListener("click", e => {
    if (hoverCol < 0 || hoverRow < 0) return;

    // Snap grid
    let snappedRow = Math.round(hoverRow * editor.snapSteps) / editor.snapSteps;

    // Buscar nota existente
    let found = editor.notes.find(n => n.col === hoverCol && n.row === snappedRow);
    if (found) {
      selectedNote = found;
      document.getElementById("noteTypeSelect").value = found.noteType;
      document.getElementById("sustainLength").value = found.sLen;
    } else {
      let newNote = {
        col: hoverCol,
        row: snappedRow,
        type: 0,
        sLen: 0,
        noteType: document.getElementById("noteTypeSelect").value
      };
      editor.notes.push(newNote);
      selectedNote = newNote;
      document.getElementById("sustainLength").value = newNote.sLen;
    }
  });

  canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    hoverCol = Math.floor(mouseX / editor.colWidth);

    let bpm = parseFloat(document.getElementById("songBpm").value);
    let stepMs = (60000 / bpm) / 4;
    let elapsed = editor.playing ? (performance.now() - editor.startTime) + parseInt(document.getElementById("audioOffset").value) : 0;
    let row = elapsed / stepMs;
    let localRow = row % editor.sectionLength;

    let baseOffset = editor.playheadY - (localRow * editor.rowHeight) - (editor.rowHeight / 2) + editor.scrollOffset;
    let visualY = mouseY - baseOffset;
    let relativeRow = visualY / editor.rowHeight;
    let rawRow = relativeRow + editor.scrollSection * editor.sectionLength;

    hoverRow = Math.floor(rawRow);
  });

  canvas.addEventListener("mouseleave", () => {
    hoverCol = -1;
    hoverRow = -1;
  });

  document.getElementById("noteTypeSelect").onchange = e => {
    if(selectedNote) selectedNote.noteType = e.target.value;
  };
}
