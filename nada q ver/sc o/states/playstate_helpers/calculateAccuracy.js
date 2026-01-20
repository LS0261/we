  export function calculateAccuracy() {
    const totalHits = this.ratingsCount.sick + this.ratingsCount.good + this.ratingsCount.bad + this.ratingsCount.shit + this.misses;
    if (totalHits === 0) return 100;
    const weightedHits = this.ratingsCount.sick * 1 + this.ratingsCount.good * 0.75 + this.ratingsCount.bad * 0.5 + this.ratingsCount.shit * 0.25;
    return ((weightedHits / totalHits) * 100).toFixed(2);
  }