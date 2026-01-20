export function calculateNoteY(note, songPos, receptorY, upwards, baseDistance, scrollDuration) {
    // tiempo restante en ms
    const timeLeft = note.time - songPos;  

    // velocidad: px/ms
    const speed = baseDistance / scrollDuration; 

    // limitar para que no se pase de la posición
    let deltaY = timeLeft * speed;
    if (upwards) {
        return receptorY + deltaY;
    } else {
        return receptorY - deltaY;
    }
}
