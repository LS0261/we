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

// -------- CREAR RECTÁNGULOS DE TOUCH (MÓVIL) ------------
export function createTouchLanes(state, force = false) {
    const isMobile = /Mobi|Android|Windowns|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent) ||                  
    window.matchMedia("(pointer: coarse)").matches;
                     
    if (!isMobile && !force) return;
    if (document.getElementById("touchLanes")) return;

    const container = document.createElement("div");
    container.id = "touchLanes";
    container.style.position = "fixed";
    container.style.left = "0";
    container.style.top = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);

    const colors = ["#C24B99", "#00FFFF", "#12FA05", "#F9393F"];
    const btns = [];

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

    // No eliminamos holdNote aquí, lo hará updateHoldNotes
}

    // Crear botones
    for (let i = 0; i < 4; i++) {
        const btn = document.createElement("div");
        btn.style.position = "absolute";
        btn.style.bottom = "8%";
        btn.style.width = "15%";
        btn.style.height = "25%";
        btn.style.border = `3px solid ${colors[i]}`;
        btn.style.borderRadius = "12px";
        btn.style.background = "rgba(255,255,255,0.05)";
        btn.style.pointerEvents = "auto";
        btn.style.touchAction = "none";
        btn.style.transition = "all 0.15s ease";
        btn.style.zIndex = "10000";

        // Centrarlos en X
        const spacing = 16;
        btn.style.left = `${50 - (spacing * 1.5) + i * spacing}%`;
        btn.style.transform = "translateX(-50%)";

        container.appendChild(btn);
        btns.push(btn);
    }

    // Obtener lane en base a posición
    function getLaneAt(x, y) {
        for (let i = 0; i < btns.length; i++) {
            const rect = btns[i].getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return i;
            }
        }
        return -1;
    }

    const activeTouches = {};

    container.addEventListener("touchstart", (e) => {
        for (let t of e.changedTouches) {
            const lane = getLaneAt(t.clientX, t.clientY);
            if (lane !== -1) {
                activeTouches[t.identifier] = lane;
                pressLane(lane);
            } else {
                activeTouches[t.identifier] = -1; // empieza fuera, pero lo seguiremos
            }
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
