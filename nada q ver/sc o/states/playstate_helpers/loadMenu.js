// loadMenu.js
export function loadMenu(playStateInstance) {
  const menuDiv = document.getElementById("menu"); // buscar aquí
  if (!menuDiv) {
    console.error("No se encontró el elemento #menu");
    return;
  }

  fetch("data/weeks/weekList.json")
    .then(res => res.json())
    .then(json => {
      menuDiv.innerHTML = "<h2>Selecciona una week:</h2>";
      json.weeks.forEach(week => {
        week.songs.forEach(songEntry => {
          const songName = songEntry[0];
          const btn = document.createElement("button");
          btn.textContent = `${week.weekName} - ${songName}`;
          btn.onclick = () => {
            playStateInstance.startSong(songName.toLowerCase());
            menuDiv.style.display = "none";
          };
          menuDiv.appendChild(btn);
        });
      });
    })
    .catch(err => {
      console.error("Error cargando weekList.json:", err);
      menuDiv.innerHTML = "<p>Error cargando weeks.</p>";
    });
}
export function loadStagePositions(playStateInstance) {
  // aquí iría tu lógica de posiciones de stage
}