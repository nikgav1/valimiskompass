export type PoliticianMatch = {
  party: string;
  name: string;
  candidateNumber: string;
  percent: number | null;
};


export type MatchResult = Record<string, PoliticianMatch>;

export interface PoliticianJson {
  party?: string;
  name: string;
  candidateNumber?: string;
  // positions can contain null for missing unrecognized answers
  positions: Array<number | null>;
}

export function computeMatchesFromJson(
  answers: number[],
  politicians: PoliticianJson[],
  options?: { questionCount?: number }
): MatchResult {
  const EPS = 1e-12;
  const QUESTION_COUNT = options?.questionCount ?? answers.length;

  // validate answers length matches QUESTION_COUNT
  if (!Array.isArray(answers) || answers.length !== QUESTION_COUNT) {
    throw new TypeError(`answers must be an array of length ${QUESTION_COUNT}`);
  }

  // validate answers values
  for (let i = 0; i < QUESTION_COUNT; i++) {
    const v = answers[i];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < -1 || v > 1) {
      throw new TypeError(`answers[${i}] must be a finite number in [-1,1]`);
    }
  }

  const result: MatchResult = {};

  for (const p of politicians) {
    const party = (p.party ?? '').toString().trim();
    const name = (p.name ?? '').toString().trim();
    const candidateNumber = (p.candidateNumber ?? '').toString().trim();

    // choose record key: prefer candidateNumber when non-empty, otherwise name
    const key = candidateNumber !== '' ? candidateNumber : name || `idx_${Math.random().toString(36).slice(2, 8)}`;

    // if positions not present or name empty, mark null
    if (!p.positions || !Array.isArray(p.positions) || !name) {
      result[key] = { party, name, candidateNumber, percent: null };
      continue;
    }

    // build paired vectors for indices [0..QUESTION_COUNT-1] where politician has a valid
    const uVec: number[] = [];
    const pVec: number[] = [];

    for (let i = 0; i < QUESTION_COUNT; i++) {
      const pRaw = p.positions[i];
      // skip if politician's answer is null/undefined or not a finite number
      if (pRaw === null || pRaw === undefined) continue;
      const pVal = Number(pRaw);
      if (!Number.isFinite(pVal) || pVal < -1 || pVal > 1) continue;

      // user answer at same index is guaranteed valid from validation above
      const uVal = answers[i];
      uVec.push(uVal);
      pVec.push(pVal);
    }

    // if no overlapping answers, return null
    if (pVec.length === 0) {
      result[key] = { party, name, candidateNumber, percent: null };
      continue;
    }

    // compute norms
    let sumU2 = 0;
    let sumP2 = 0;
    for (let i = 0; i < pVec.length; i++) {
      sumU2 += uVec[i] * uVec[i];
      sumP2 += pVec[i] * pVec[i];
    }
    const normU = Math.sqrt(sumU2);
    const normP = Math.sqrt(sumP2);

    if (normU <= EPS || normP <= EPS) {
      result[key] = { party, name, candidateNumber, percent: null };
      continue;
    }

    // compute dot of normalized vectors
    let dot = 0;
    for (let i = 0; i < pVec.length; i++) {
      dot += (uVec[i] / normU) * (pVec[i] / normP);
    }

    // clamp dot to [-1,1] then convert to percent [0,100]
    const score = Math.max(-1, Math.min(1, dot));
    const percent = Math.round(((score + 1) / 2) * 10000) / 100; // 2 decimals

    result[key] = { party, name, candidateNumber, percent };
  }

  return result;
}
