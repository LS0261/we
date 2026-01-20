import FlxSpriteJS from "../../utils/FlxSpriteJS.js";
import Paths from "../../backend/paths.js";

export function startCountdown(playState, onComplete) {
  const messages = ["3", "2", "1", "Go!"];
  let current = 0;

  const canvas = playState.hudCanvas;
  const ctx = playState.ctxHUD;

  const bpm = playState.bpmSections[0]?.bpm ?? 120;
  const delay = 60000 / bpm; // tiempo entre beats

  // Sonidos
  const intro3 = new Audio("sounds/intro3.ogg");
  const intro2 = new Audio("sounds/intro2.ogg");
  const intro1 = new Audio("sounds/intro1.ogg");
  const goSound = new Audio("sounds/introGo.ogg");

  const generalVolume = 0.7;
  intro3.volume = intro2.volume = intro1.volume = goSound.volume = generalVolume;

  // Sprites del countdown
  const sprites = {
    "2": new FlxSpriteJS(),
    "1": new FlxSpriteJS(),
    "Go!": new FlxSpriteJS()
  };

  // cargar gráficos
  sprites["2"].loadGraphic(Paths.image("ready")).then(s => {
    s.setGraphicSize(200); // ajusta tamaño
    s.updateHitbox();
    s.screenCenter();
  });
  sprites["1"].loadGraphic(Paths.image("set")).then(s => {
    s.setGraphicSize(200);
    s.updateHitbox();
    s.screenCenter();
  });
  sprites["Go!"].loadGraphic(Paths.image("go")).then(s => {
    s.setGraphicSize(200);
    s.updateHitbox();
    s.screenCenter();
  });

  function drawCountdown(text) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (text === "3") {
      // 🔹 solo sonido, no sprite
      return;
    }

    const spr = sprites[text];
    if (spr && spr.image) {
      spr.screenCenter();
      spr.draw(ctx);
    }
  }

  function next() {
    if (current < messages.length) {
      const text = messages[current];
      drawCountdown(text);

      // Sonidos
      switch (text) {
        case "3": intro3.currentTime = 0; intro3.play(); break;
        case "2": intro2.currentTime = 0; intro2.play(); break;
        case "1": intro1.currentTime = 0; intro1.play(); break;
        case "Go!": goSound.currentTime = 0; goSound.play(); break;
      }

      current++;
      setTimeout(next, delay);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (typeof onComplete === "function") onComplete();
    }
  }

  next();
}
