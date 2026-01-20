// sc/states/playstate_helpers/runEvent.js
export function runEvent(playStateInstance, name, params) {
  switch (name) {
    case "Play Animation":
      const [animName, target] = params;
      let char = null;

      if (target === "bf") char = playStateInstance.boyfriend;
      else if (target === "dad") char = playStateInstance.dad;
      else if (target === "gf") char = playStateInstance.gf;

      if (char && typeof char.playAnim === "function") {
        char.playAnim(animName, true);
      } else {
        console.warn(`No se encontró el personaje "${target}" o no tiene playAnim.`);
      }
      break;

    default:
      console.warn(`Evento desconocido: ${name}`);
      break;
  }
}
