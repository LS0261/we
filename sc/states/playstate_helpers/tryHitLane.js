import { addRatingSprite } from "./addRatingSprite.js";
import { addComboSprite } from "./addComboSprite.js";
import { defaultRatings } from "./addRatingSprite.js";

// -------- FUNCION PRINCIPAL DE HIT ------------
export function tryHitLane(state, laneIdx) {
    // OFFSET opcional para sincronización
    const songPos = state.getSongPos() - (state.songOffset || 0);
    let hit = false;

    const earlyLimit = state.hitWindowBFMin; // -150
    
    for (let i = 0; i < state.bfNotes.length; i++) {
        const note = state.bfNotes[i];
        if (note.lane !== laneIdx || note.hit) continue;

        const diff = songPos - note.time; // negativo = antes, positivo = después

        // debug
        //console.log("🟢 Lane:", laneIdx, "Note:", note.time, "SongPos:", songPos, "Diff:", diff);

        // ventana de hit (ej: ±150ms)
        if (diff >= state.hitWindowBFMin && diff <= state.hitWindowBFMax) {
            note.hit = true;
            hit = true;

            // --- rating según la diferencia ---
            let rating;
            if (Math.abs(diff) <= 45) rating = "sick";
            else if (Math.abs(diff) <= 90) rating = "good";
            else if (Math.abs(diff) <= 135) rating = "bad";
            else rating = "shit";

            state.notesPassed++;
            state.combo++;
            state.ratingsCount[rating] = (state.ratingsCount[rating] || 0) + 1;

            // puntaje ejemplo
            const scoreTable = { sick: 350, good: 200, bad: 100, shit: 50 };
            state.score += scoreTable[rating] ?? 0;

            addComboSprite(state, state.combo);

            const anims = ["singLEFT", "singDOWN", "singUP", "singRIGHT"];
            state.boyfriend?.playAnim(anims[laneIdx], true);

            // lane confirm
            const lane = state.laneStatesPlayer[laneIdx];
            lane.state = "confirm";
            lane.timer = 9;
            lane.frameIdx = 0;

            // curación
            //state.targetHealth = Math.min(state.playerMaxHealth, state.targetHealth + 1.25);
            state.targetHealth += 1.25;

const ratingObj = defaultRatings.find(r => r.name === rating);
addRatingSprite(state, ratingObj);

            // eliminar nota o iniciar hold
            if (note.sustain > 0) {
                state.lanesHeld[laneIdx].holdNote = note;
                note.isHolding = true;
            } else {
                state.bfNotes.splice(i, 1);
            }

            break;
        }
    }

    // --- si no acertó ninguna nota ---
    if (!hit) {
        state.misses++;
        state.combo = 0;

        //state.targetHealth = Math.min(state.playerMaxHealth, state.targetHealth - 1.25);
        state.targetHealth -= 2.5;
        const anims = ["singLEFTmiss", "singDOWNmiss", "singUPmiss", "singRIGHTmiss"];
        state.boyfriend?.playAnim(anims[laneIdx], true);

        //console.log("❌ Miss en lane", laneIdx);
    }
}
// Llamar en tu loop principal de actualización
export function updateHoldNotes(state) {
    const songPos = state.getSongPos() - (state.songOffset || 0);

    for (let laneIdx = 0; laneIdx < state.lanesHeld.length; laneIdx++) {
        const lane = state.lanesHeld[laneIdx];
        const note = lane.holdNote;

        if (!note) continue;

        // Si seguimos sosteniendo y la nota no ha terminado
        if (lane.held && songPos <= note.time + note.sustain) {
            // Mantener animación de singing
            const anims = ["singLEFT", "singDOWN", "singUP", "singRIGHT"];
            state.boyfriend?.playAnim(anims[laneIdx], true);
        } else {
            // Liberar la nota
            lane.holdNote = null;
            note.hit = true; // marcar como completada

            const idx = state.bfNotes.indexOf(note);
            if (idx !== -1) state.bfNotes.splice(idx, 1);
        }
    }
}

// -------- CREAR RECTÁNGULOS DE TOUCH (MÓVIL/ESCRITORIO) ------------
export function createTouchLanes(state, force = false) {
    const isMobile = /Mobi|Android|Windows|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent) ||
                     window.matchMedia("(pointer: coarse)").matches;
    if (!isMobile && !force) return; // solo activar en móvil por defecto
    if (document.getElementById("touchLanes")) return; // ya existe

    const container = document.createElement("div");
    container.id = "touchLanes";
    container.style.position = "fixed";
    container.style.left = "0";
    container.style.top = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none"; // contenedor no bloquea, solo los botones
    container.style.zIndex = "10000";
    document.body.appendChild(container);

    const colors = ["#C24B99", "#00FFFF", "#12FA05", "#F9393F"];
    const btns = [];

    // Funciones de presionar y soltar
    function pressLane(i) {
        const btn = btns[i];
        btn.style.background = `${colors[i]}55`;
        btn.style.boxShadow = `0 0 20px ${colors[i]}aa`;
        state.lanesHeld[i].held = true;
        tryHitLane(state, i);
    }

    function releaseLane(i) {
        const btn = btns[i];
        btn.style.background = "rgba(255,255,255,0.05)";
        btn.style.boxShadow = "none";
        state.lanesHeld[i].held = false;
        // updateHoldNotes se encarga de limpiar holdNote
    }

    // Crear 4 botones grandes y separados
    for (let i = 0; i < 4; i++) {
        const btn = document.createElement("div");
        btn.style.position = "absolute";
        btn.style.bottom = "5vh";        // un poco más arriba del borde
        btn.style.width = "18vw";        // ancho cómodo
        btn.style.height = "30vh";       // alto cómodo
        btn.style.border = `3px solid ${colors[i]}`;
        btn.style.borderRadius = "12px";
        btn.style.background = "rgba(255,255,255,0.05)";
        btn.style.pointerEvents = "auto";
        btn.style.touchAction = "none";
        btn.style.transition = "all 0.15s ease";
        btn.style.zIndex = "10001";

        // Distribuir horizontalmente
        btn.style.left = `${10 + i * 22}%`; // separa los botones
        btn.style.transform = "translateX(0%)";

        container.appendChild(btn);
        btns.push(btn);
    }

    // Detectar en qué botón cayó el toque
    function getLaneAt(x, y) {
        for (let i = 0; i < btns.length; i++) {
            const rect = btns[i].getBoundingClientRect();
            // tolerancia de 10px para no fallar toques
            if (x >= rect.left - 10 && x <= rect.right + 10 &&
                y >= rect.top - 10 && y <= rect.bottom + 10) {
                return i;
            }
        }
        return -1;
    }

    const activeTouches = {};

    // Eventos touch
    container.addEventListener("touchstart", (e) => {
        for (let t of e.changedTouches) {
            const lane = getLaneAt(t.clientX, t.clientY);
            if (lane !== -1) {
                activeTouches[t.identifier] = lane;
                pressLane(lane);
            } else activeTouches[t.identifier] = -1;
        }
    });

    container.addEventListener("touchmove", (e) => {
        for (let t of e.changedTouches) {
            const prevLane = activeTouches[t.identifier];
            const newLane = getLaneAt(t.clientX, t.clientY);
            if (newLane !== prevLane) {
                if (prevLane !== -1) releaseLane(prevLane);
                if (newLane !== -1) pressLane(newLane);
                activeTouches[t.identifier] = newLane;
            }
        }
    });

    container.addEventListener("touchend", (e) => {
        for (let t of e.changedTouches) {
            const lane = activeTouches[t.identifier];
            if (lane !== -1) releaseLane(lane);
            delete activeTouches[t.identifier];
        }
    });

    container.addEventListener("touchcancel", (e) => {
        for (let t of e.changedTouches) {
            const lane = activeTouches[t.identifier];
            if (lane !== -1) releaseLane(lane);
            delete activeTouches[t.identifier];
        }
    });
}
