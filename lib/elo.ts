/**
 * Pure Elo calculation functions — no side effects, no DB access.
 */

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function kFactor(comparisonCount: number): number {
  return comparisonCount < 10 ? 32 : 16;
}

export function newRating(
  rating: number,
  actualScore: number, // 1 for win, 0 for loss
  expected: number,
  comparisons: number
): number {
  return rating + kFactor(comparisons) * (actualScore - expected);
}

export interface EloResult {
  newWinnerElo: number;
  newLoserElo: number;
}

export function calculateEloUpdate(
  winner: { elo_rating: number; comparison_count: number },
  loser: { elo_rating: number; comparison_count: number }
): EloResult {
  const eWinner = expectedScore(winner.elo_rating, loser.elo_rating);
  const eLoser = expectedScore(loser.elo_rating, winner.elo_rating);

  return {
    newWinnerElo: newRating(
      winner.elo_rating,
      1,
      eWinner,
      winner.comparison_count
    ),
    newLoserElo: newRating(
      loser.elo_rating,
      0,
      eLoser,
      loser.comparison_count
    ),
  };
}
