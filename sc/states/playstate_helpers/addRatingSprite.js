import FlxSpriteJS from "../../utils/FlxSpriteJS.js";

// Array global para que el juego dibuje varios ratings
export const activeRatings = [];

// Clase Rating JS tipo HX
export class Rating {
    constructor(name, hitWindow = 0, ratingMod = 1, score = 350, noteSplash = true, image = null) {
        this.name = name;
        this.hitWindow = hitWindow;
        this.ratingMod = ratingMod;
        this.score = score;
        this.noteSplash = noteSplash;
        this.image = image || name; // nombre de sprite o imagen
        this.hits = 0;
    }
}

// Ratings por defecto
export const defaultRatings = [
    new Rating("sick", 0, 1, 350, true),
    new Rating("good", 0, 0.67, 200, false),
    new Rating("bad", 0, 0.34, 100, false),
    new Rating("shit", 0, 0, 50, false)
];

// Función para añadir un rating en pantalla
export async function addRatingSprite(state, rating) {
    const playbackRate = 1; // velocidad del juego
    const showRating = true; // siempre visible
    const placement = window.innerWidth / 2; // posición horizontal base

    let container = document.getElementById("ratingContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "ratingContainer";
        container.style.position = "fixed";
        container.style.left = "0";
        container.style.top = "0";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.pointerEvents = "none";
        container.style.zIndex = "9999";
        document.body.appendChild(container);
    }

    // Wrapper principal
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = `${placement - 60}px`;
    wrapper.style.top = `${window.innerHeight / 2 - 60}px`;
    wrapper.style.textAlign = "center";
    wrapper.style.pointerEvents = "none";
    wrapper.style.userSelect = "none";

    // Color según rating
    const ratingColors = {
        sick: "#00FFFF",
        good: "#00FF00",
        bad: "#FFFF00",
        shit: "#FF0000"
    };
    const color = ratingColors[rating.name.toLowerCase()] || "#FFFFFF";

    // Texto principal del rating
    const ratingText = document.createElement("div");
    ratingText.textContent = rating.name.toUpperCase();
    ratingText.style.fontSize = "48px";
    ratingText.style.color = color;
    ratingText.style.textShadow = "0 4px 10px black";
    ratingText.style.fontFamily = "Arial Black, Impact, sans-serif";
    ratingText.style.transform = "scale(0)"; // empezamos invisible
    wrapper.appendChild(ratingText);

    // Combo
    const comboText = document.createElement("div");
    comboText.textContent = `x${state.combo || 1}`;
    comboText.style.fontSize = "28px";
    comboText.style.color = "#FFFFFF";
    comboText.style.textShadow = "0 3px 8px black";
    comboText.style.transform = "scale(0)";
    wrapper.appendChild(comboText);

    container.appendChild(wrapper);

    // Animación inicial: pop/bounce como en HX
    let t = 0;
    const duration = 0.8; // segundos
    const startY = window.innerHeight / 2 - 60;
    let y = startY;
    const vy = -140 * playbackRate; // impulso inicial
    const ay = 550 * playbackRate; // gravedad

function animate(dt) {
    t += dt;

    // Física vertical
    y = startY + vy * t + 0.5 * ay * t * t;
    wrapper.style.top = `${y}px`;

    // Escala pop/bounce
    const scale = Math.min(1, t * 3);
    ratingText.style.transform = `scale(${scale})`;
    comboText.style.transform = `scale(${scale})`;

    // Fade progresivo
    let opacity = 1;
    if (t > 0.4) {
        opacity = Math.max(0, 1 - (t - 0.4) * 2.5);
    }
    wrapper.style.opacity = opacity;

    // Remover cuando desaparece
    if (opacity <= 0) {
        wrapper.remove();
        return;
    }

    requestAnimationFrame(() => animate(1 / 60));
}

    requestAnimationFrame(() => animate(1 / 60));
}
