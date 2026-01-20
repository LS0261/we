export function initSections() {
  // variables internas
  let snapSteps = parseInt(document.getElementById("snap")?.value) || 4;
  let scrollSection = 0;
  let scrollOffset = 0;
  const canvas = document.getElementById("chart");
  const rowsPerSection = 16;
  const rowHeight = 40;
  const sectionLength = 16;
  let pausedTime = 0;
  let sectionData = [];
  let notes = [];

  // Crear botones si no existen
  function createButton(id, text, parent = document.body) {
    let btn = document.getElementById(id);
    if (!btn) {
      btn = document.createElement("button");
      btn.id = id;
      btn.textContent = text;
      parent.appendChild(btn);
    }
    return btn;
  }

  const snapLeft = createButton("snapLeft", "←");
  const snapRight = createButton("snapRight", "→");
  const nextSection = createButton("nextSection", "Next Section");
  const prevSection = createButton("prevSection", "Prev Section");
  const mustHit = createButton("mustHit", "Must Hit", document.body);
  mustHit.type = "checkbox";
  const newChart = createButton("newChart", "New Chart");
  const scrollUp = createButton("scrollUp", "Scroll Up");
  const scrollDown = createButton("scrollDown", "Scroll Down");

  const snapDisplay = document.getElementById("snapDisplay") || (() => {
    const div = document.createElement("div");
    div.id = "snapDisplay";
    document.body.appendChild(div);
    return div;
  })();

  function updateSnapDisplay() {
    snapDisplay.textContent = `Beat Snap: ${snapSteps} / 16`;
  }

  snapLeft.onclick = () => {
    if (snapSteps > 1) { snapSteps--; updateSnapDisplay(); }
  };

  snapRight.onclick = () => {
    if (snapSteps < 192) { snapSteps++; updateSnapDisplay(); }
  };

  updateSnapDisplay();

  nextSection.onclick = () => {
    let maxSections = getMaxSections();
    if (scrollSection < maxSections - 1) {
      scrollSection++;
      pausedTime = scrollSection * sectionLength * (60000 / parseFloat(document.getElementById("songBpm")?.value || 120) / 4) / 1000;
    }
  };

  prevSection.onclick = () => {
    if (scrollSection > 0) {
      scrollSection--;
      pausedTime = scrollSection * sectionLength * (60000 / parseFloat(document.getElementById("songBpm")?.value || 120) / 4) / 1000;
    }
  };

  mustHit.onchange = e => { sectionData[scrollSection] = e.target.checked; };

  newChart.onclick = () => {
    notes = [];
    sectionData = [];
    scrollSection = 0;
    ["songName","bpm","speed","stage","player1","player2","gf"].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.value = (id === "bpm" ? 120 : id==="speed"?1: id==="songName"? "untitled":"bf");
    });
  };

  scrollUp.onclick = () => { scrollOffset -= 40; };
  scrollDown.onclick = () => { scrollOffset += 40; };

  // Dragging y wheel del canvas
  let dragging = false, lastY = 0;
  canvas?.addEventListener("mousedown", e => { dragging = true; lastY = e.clientY; });
  canvas?.addEventListener("mouseup", () => dragging = false);
  canvas?.addEventListener("mouseleave", () => dragging = false);
  canvas?.addEventListener("mousemove", e => {
    if(dragging){ scrollOffset += e.clientY - lastY; lastY = e.clientY; clampScroll(); }
  });
  canvas?.addEventListener("wheel", e => {
    e.preventDefault();
    scrollOffset += Math.sign(e.deltaY) * rowHeight;
    scrollOffset = Math.round(scrollOffset / rowHeight) * rowHeight;
    clampScroll();
  }, {passive:false});

  function clampScroll() {
    const maxSections = getMaxSections();
    const maxOffset = (maxSections * rowsPerSection * rowHeight) - (canvas?.height||0);
    if(scrollOffset<0) scrollOffset=0;
    if(scrollOffset>maxOffset) scrollOffset=maxOffset;
  }

  function getMaxSections() {
    const bpm = parseFloat(document.getElementById("songBpm")?.value || 120);
    return Math.ceil(notes.length / sectionLength);
  }
}
