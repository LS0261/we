// fileExport.js (modular)
export function initFileExport(editor) {
  let lastDirectoryHandle = null; // recordar último directorio

  const exportBtn = document.getElementById("export");
  if (!exportBtn) return;

  exportBtn.onclick = async () => {
    const bpm = parseFloat(document.getElementById("bpm").value);
    const stepMs = (60000 / bpm) / 4;
    const maxRow = editor.notes.reduce((m, n) => Math.max(m, n.row), 0);
    const sections = Math.ceil((maxRow + 1) / editor.sectionLength);

    const data = {
      song: {
        song: document.getElementById("songName").value || "untitled",
        bpm: bpm,
        speed: parseFloat(document.getElementById("speed").value),
        stage: document.getElementById("stage").value,
        player1: document.getElementById("player1").value,
        player2: document.getElementById("player2").value,
        gf: document.getElementById("gf").value,
        notes: []
      }
    };

    for (let s = 0; s < sections; s++) {
      const section = {
        lengthInSteps: editor.sectionLength,
        sectionNotes: [],
        mustHitSection: editor.sectionData[s] ?? true
      };

      for (let n of editor.notes) {
        if (Math.floor(n.row / editor.sectionLength) === s) {
          let time = n.row * stepMs;
          let col = n.col;

          if (!section.mustHitSection) {
            if (n.col >= 0 && n.col <= 3) col += 4;
            else if (n.col >= 4 && n.col <= 7) col -= 4;
          }

          section.sectionNotes.push([time, col, n.sLen * stepMs, n.noteType || ""]);
        }
      }

      data.song.notes.push(section);
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });

    try {
      const options = {
        suggestedName: "chart.json",
        types: [{ description: "JSON files", accept: { "application/json": [".json"] } }]
      };
      if (lastDirectoryHandle) options.startIn = lastDirectoryHandle;

      const handle = await window.showSaveFilePicker(options);
      if (!handle) return;
      lastDirectoryHandle = handle;

      const writableStream = await handle.createWritable();
      await writableStream.write(blob);
      await writableStream.close();

      alert("Archivo guardado correctamente ✅");
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error al guardar archivo:", error);
        alert("No se pudo guardar el archivo. Revisa la consola.");
      }
    }
  };
}
