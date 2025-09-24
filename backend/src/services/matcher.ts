export type MatchResult = Record<string, number | null>;

export interface PoliticianJson {
  name: string;
  positions: number[];
}

/**
 * Compute percent matches for all politicians from a JSON array.
 *
 * What this function expects:
 *  - `answers`:
 *      * Type: `number[]`
 *      * Length: exactly `questionCount` (default 20)
 *      * Each value: finite number in the range [-1, 1]
 *
 *  - `politicians`:
 *      * Array of { name: string, positions: number[] }
 *      * Each positions array must be length = questionCount
 *
 *  - `options` (optional):
 *      * `questionCount?: number` — number of questions (default: 20)
 *
 * What the function returns:
 *  - `MatchResult`: Record<politicianName, percent | null>
 *      * `percent` is a number in [0,100], rounded to 2 decimals.
 *      * `null` means invalid/missing data for that politician.
 */

export function computeMatchesFromJson(
  answers: number[],
  politicians: PoliticianJson[],
  options?: { questionCount?: number }
): MatchResult {
  const QUESTION_COUNT = options?.questionCount ?? 20;
  const EPS = 1e-12;

  // validate answers
  if (!Array.isArray(answers) || answers.length !== QUESTION_COUNT) {
    throw new TypeError(`answers must be an array of length ${QUESTION_COUNT}`);
  }
  for (let i = 0; i < QUESTION_COUNT; i++) {
    const v = answers[i];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < -1 || v > 1) {
      throw new TypeError(`answers[${i}] must be a finite number in [-1,1]`);
    }
  }

  // normalize user answers
  let sumU2 = 0;
  for (let i = 0; i < QUESTION_COUNT; i++) sumU2 += answers[i] * answers[i];
  const userNorm = Math.sqrt(sumU2);
  const userUnit = userNorm > EPS ? answers.map(v => v / userNorm) : new Array(QUESTION_COUNT).fill(0);

  // compute for each politician
  const result: MatchResult = {};
  for (const p of politicians) {
    if (!p.positions || p.positions.length !== QUESTION_COUNT) {
      result[p.name] = null;
      continue;
    }

    let sumP2 = 0;
    const pArr = new Array(QUESTION_COUNT);
    for (let i = 0; i < QUESTION_COUNT; i++) {
      const v = Number(p.positions[i]) || 0;
      pArr[i] = v;
      sumP2 += v * v;
    }

    const pNorm = Math.sqrt(sumP2);
    if (pNorm <= EPS) {
      result[p.name] = null;
    } else {
      let dot = 0;
      for (let i = 0; i < QUESTION_COUNT; i++) {
        dot += userUnit[i] * (pArr[i] / pNorm);
      }
      const score = Math.max(-1, Math.min(1, dot));
      const percent = Math.round(((score + 1) / 2) * 10000) / 100;
      result[p.name] = percent;
    }
  }

  return result;
}
