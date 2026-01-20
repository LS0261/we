  export function tryHitLane(lane) {
    const songPos = this.getSongPos();
    for (let i = 0; i < this.bfNotes.length; i++) {
      const note = this.bfNotes[i];
      if (note.lane - 4 !== lane || note.hit) continue;

      const diff = Math.abs(songPos - note.time);
      if (diff <= this.hitWindow) {
        // Animación confirm
        this.laneStates[lane].state = "confirm";
        this.laneStates[lane].timer = 6;
        this.laneStates[lane].frameIdx = 0;

        note.hit = true;
        this.bfNotes.splice(i, 1);

        if (note.sustain > 0) {
          this.lanesHeld[lane].holdNote = note;
        }

        addRatingSprite(diff);
        this.hitSound.currentTime = 0;
        this.hitSound.play();

        this.targetHealth = Math.min(this.playerMaxHealth, this.targetHealth + 3);

        const anims = ["singLEFT", "singDOWN", "singUP", "singRIGHT"];
        if (this.boyfriend) {
          this.boyfriend.play(anims[lane]);
          this.boyfriend.singTimer = this.boyfriend.data.sing_duration || 1;
        }
        return;
      }
    }

    // Fallo
    this.targetHealth = Math.max(0, this.targetHealth - 1.5);
    this.laneStates[lane].state = "press";
    this.laneStates[lane].timer = 4;
    this.laneStates[lane].frameIdx = 0;
  }
