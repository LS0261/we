// fileImport.js (modular)
export function initFileImport(editor) {
  const input = document.getElementById("import");
  if (!input) return;

  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);

        // Detectar formato
        let songData;
        if (data.song && data.song.notes) {
          songData = data.song;
        } else if (data.notes) {
          songData = data;
        } else {
          throw new Error("Formato desconocido");
        }

        editor.notes = [];
        editor.sectionLength = songData.notes[0]?.lengthInSteps || 16;
        editor.sectionData = [];

        // Metadatos
        document.getElementById("songName").value = songData.song || "untitled";
        document.getElementById("bpm").value = songData.bpm || 120;
        document.getElementById("speed").value = songData.speed || 1;
        document.getElementById("stage").value = songData.stage || "stage";
        document.getElementById("player1").value = songData.player1 || "bf";
        document.getElementById("player2").value = songData.player2 || "dad";
        document.getElementById("gf").value = songData.gf || "gf";

        // Rellenar notas
        const bpm = parseFloat(document.getElementById("bpm").value);
        const stepMs = (60000 / bpm) / 4;

        for (let secIndex = 0; secIndex < songData.notes.length; secIndex++) {
          const sec = songData.notes[secIndex];
          if (!sec) continue;

          editor.sectionData[secIndex] = sec.mustHitSection ?? true;

          if (Array.isArray(sec.sectionNotes)) {
            for (const sn of sec.sectionNotes) {
              const strumTime = sn[0];
              const row = Math.round(strumTime / stepMs);
              const sustainMs = sn[2] || 0;

              editor.notes.push({
                strumTime,
                col: sn[1],
                row,
                type: "",
                sLen: sustainMs,
                noteType: sn[3] || ""
              });
            }
          }
        }

        if (typeof render === "function") render();

      } catch (err) {
        console.error(err);
        document.getElementById("error").textContent = "JSON inválido o no soportado";
      }
    };

    reader.readAsText(file);
  };
}
