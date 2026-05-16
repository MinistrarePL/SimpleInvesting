/** Granica „neutralnego” pasma wokół zera (spójnie z UI). */
export const SENTIMENT_NEUTRAL_EPS = 0.05;

export type SentimentTone = 'positive' | 'negative' | 'neutral';

/** Kolejność opcji w filtrach (zgodna z etykietami tabeli). */
export const SENTIMENT_TONES: SentimentTone[] = ['positive', 'neutral', 'negative'];

export function getSentimentTone(score: number): SentimentTone {
  if (score > SENTIMENT_NEUTRAL_EPS) return 'positive';
  if (score < -SENTIMENT_NEUTRAL_EPS) return 'negative';
  return 'neutral';
}
