  export function handleMouseTouch(x) {
    const spacing = this.W / 4;
    const startX = (this.W - spacing * 4) / 2;
    const lane = Math.floor((x - startX) / spacing);
    if (lane >= 0 && lane < 4) {
      if (!this.lanesHeld[lane].held) {
        this.tryHitLane(lane);
        this.lanesHeld[lane].held = true;
      }
    }
  }


  export function handleTouches(touches) {
    const spacing = this.W / 4;
    const startX = (this.W - spacing * 4) / 2;
    const lanesThisTouch = [
      { held: false, holdNote: null },
      { held: false, holdNote: null },
      { held: false, holdNote: null },
      { held: false, holdNote: null },
    ];

    for (const t of touches) {
      const lane = Math.floor((t.clientX - startX) / spacing);
      if (lane >= 0 && lane < 4) {
        if (!this.lanesHeld[lane].held) {
          this.tryHitLane(lane);
          lanesThisTouch[lane] = { held: true, holdNote: null };
        }
        lanesThisTouch[lane].held = true;
      }
    }
    // ⚠️ Antes era const lanesHeld -> ahora sí podemos reasignar
    this.lanesHeld = lanesThisTouch;
  }