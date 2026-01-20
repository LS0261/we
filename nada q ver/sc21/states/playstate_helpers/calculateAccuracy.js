export function calculateAccuracy(state) {
  const { ratingsCount } = state;
  const totalHits = ratingsCount.sick + ratingsCount.good + ratingsCount.bad + ratingsCount.shit + ratingsCount.miss;
  if (totalHits === 0) return 100;
  
  const weightedHits = ratingsCount.sick * 1.0 + ratingsCount.good * 0.75 + ratingsCount.bad * 0.4 + ratingsCount.shit * 0.2;
  return (weightedHits / totalHits) * 100;
}
