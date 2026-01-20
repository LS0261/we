import FlxSpriteJS from "../../utils/FlxSpriteJS.js";
import Paths from "../../backend/Paths.js";

export function startCountdown(playState, onComplete) {
  const messages = ["3", "2", "1", "Go!"];
  let current = 0;

  const bpm = playState.bpmSections[0]?.bpm ?? 120;
  const delay = 60000 / bpm;

const intro3 = new Audio(Paths.sound("intro3"));
const intro2 = new Audio(Paths.sound("intro2"));
const intro1 = new Audio(Paths.sound("intro1"));
const goSound = new Audio(Paths.sound("introGo"));
  const generalVolume = 0.7;
  intro3.volume = intro2.volume = intro1.volume = goSound.volume = generalVolume;

  const sprites = {
    "2": new FlxSpriteJS(),
    "1": new FlxSpriteJS(),
    "Go!": new FlxSpriteJS()
  };

sprites["2"].loadGraphic(Paths.image("ready")).then(s => { s.updateHitbox(); });
sprites["1"].loadGraphic(Paths.image("set")).then(s => { s.updateHitbox(); });
sprites["Go!"].loadGraphic(Paths.image("go")).then(s => { s.updateHitbox(); });

  playState.countdownSprites = sprites;

  function next() {
    if (current < messages.length) {
      const text = messages[current];

      playState.countdownText = text; // 🚨 actualizar estado en PlayState

      switch (text) {
        case "3": intro3.currentTime = 0; intro3.play(); break;
        case "2": intro2.currentTime = 0; intro2.play(); break;
        case "1": intro1.currentTime = 0; intro1.play(); break;
        case "Go!": goSound.currentTime = 0; goSound.play(); break;
      }

      current++;
      setTimeout(next, delay);
    } else {
      playState.countdownText = null;
      if (typeof onComplete === "function") onComplete();
    }
  }

  next();
}
