import { addRatingSprite } from "./addRatingSprite.js";
import { addComboSprite } from "./addComboSprite.js";

export function tryHitLane(state, laneIdx) {
    const now = state.getSongPos();
    for (let i = 0; i < state.bfNotes.length; i++) {
        const note = state.bfNotes[i];
        if (note.lane === laneIdx && !note.hit && Math.abs(now - note.time) <= state.hitWindow) {
            note.hit = true;
            state.score += 50;
            state.notesPassed++;
state.combo++;
state.score += 350; // o lo que uses
addComboSprite(state, state.combo); // si tu función usa el combo
            const anims = ["singLEFT", "singDOWN", "singUP", "singRIGHT"];
            state.boyfriend?.playAnim(anims[laneIdx], true);

            const lane = state.laneStatesPlayer[laneIdx];
            lane.state = "confirm";
            lane.timer = 9;
            lane.frameIdx = 0;

            state.bfNotes.splice(i, 1);
            state.targetHealth = Math.min(state.playerMaxHealth, state.targetHealth + 1.25);

            addRatingSprite(state, 30); // ⚠️ si tu función necesita el state

            break;
        }
    }
}
