export function calculateAccuracy(state) {
    const { ratingsCount, misses } = state;

    // Asegurarnos de que cada tipo tenga un valor numérico
    const sick = ratingsCount.sick || 0;
    const good = ratingsCount.good || 0;
    const bad = ratingsCount.bad || 0;
    const shit = ratingsCount.shit || 0;
    const miss = misses || 0;

    const totalHits = sick + good + bad + shit + miss;
    if (totalHits === 0) return 100;

    // Pesos por tipo de nota
    const weightedHits = sick * 1.0 + good * 0.8 + bad * 0.5 + shit * 0.2 + miss * 0;

    return (weightedHits / totalHits) * 100;
}
