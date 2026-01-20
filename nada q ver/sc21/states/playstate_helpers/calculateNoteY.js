export function calculateNoteY(noteTime, songPos, receptorY, upwards, spawnY = -100, songBpm = 120, scrollSpeed = 20) {
    const timeLeft = (noteTime - songPos) / 15; // segundos restantes
    const beatDuration = 60 / songBpm;           // duración de un beat en segundos
    const scrollDuration = beatDuration * 4;     // duración de scroll (4 beats)
    
    const progress = 1 - timeLeft / scrollDuration; // 0 → spawn, 1 → receptor
    const distance = (receptorY - spawnY) * scrollSpeed;
    const y = spawnY + distance * progress;

    return upwards ? receptorY - (y - spawnY) : y;
}
