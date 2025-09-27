import fs from 'fs';
import { parse } from 'csv-parse';

const inputPath = './politicians.csv';
const outPath = './politicians.json';

const input = fs.createReadStream(inputPath);
const parser = parse({ columns: true, skip_empty_lines: true, relax_column_count: true });

const outStream = fs.createWriteStream(outPath);
outStream.write('[');

let first = true;
let count = 0;

function findKeyByFragments(recordKeys, fragments) {
  return recordKeys.find(k =>
    fragments.some(f => k && k.toString().toLowerCase().includes(f.toLowerCase()))
  );
}

function mapAnswerToNumber(raw) {
  if (raw === undefined || raw === null) return null;
  const s = raw.toString().trim().toLowerCase();

  if (!s) return null;

  // priority checks (more specific first)
  if (s.includes('ei nõustu üldse') || s.includes('полностью не согласен') || s.includes('ei nõustu täielikult')) return -1;
  if (s.includes('ei nõustu') || s.includes('не согласен')) return -0.5;
  if (s.includes('neutraal') || s.includes('нейтра')) return 0;
  // strong agree checks: check for "täielikult" or russian "полностью согласен" first
  if (s.includes('täielikult') || s.includes('полностью согласен') || s.includes('nõustun täielikult')) return 1;
  if (s.includes('nõustun') || s.includes('согласен')) return 0.5;

  // fallback: attempt exact words
  if (s === '-1' || s === '-1.0') return -1;
  if (s === '-0.5' || s === '-0,5') return -0.5;
  if (s === '0' || s === '0.0') return 0;
  if (s === '0.5' || s === '0,5') return 0.5;
  if (s === '1' || s === '1.0') return 1;

  // unknown -> null
  return null;
}

parser.on('readable', () => {
  let record;
  while ((record = parser.read()) !== null) {
    const keys = Object.keys(record || {});

    // try to detect the party/name/number keys robustly (handles extra whitespace / bilingual headers)
    const partyKey = findKeyByFragments(keys, ['Erakond', 'Партия', 'valimisnimekiri']);
    const nameKey = findKeyByFragments(keys, ['Eesnimi', 'perekonnanimi', 'Имя', 'фамилия']);
    const candidateNumberKey = findKeyByFragments(keys, ['Kandidaadi number', 'Номер кандидата']);
    const timestampKey = findKeyByFragments(keys, ['Ajatempel', 'Timestamp', 'Aeg']);

    // keys to ignore when building positions
    const ignoreFragments = ['Erakond', 'Партия', 'valimisnimekiri', 'Eesnimi', 'perekonnanimi', 'Имя', 'фамилия', 'Kandidaadi number', 'Номер кандидата', 'Ajatempel', 'Timestamp', 'newField'];

    // build positions in the order of columns (so question order preserved)
    const positions = [];
    for (const k of keys) {
      // skip ignored keys (by fragment match)
      const shouldIgnore = ignoreFragments.some(f => k && k.toString().toLowerCase().includes(f.toLowerCase()));
      if (shouldIgnore) continue;

      // skip empty header accidentally
      if (!k || k.trim() === '') continue;

      const raw = record[k];
      const mapped = mapAnswerToNumber(raw);
      positions.push(mapped);
    }

    const politician = {
      party: partyKey ? (record[partyKey] || '').toString().trim() : '',
      name: nameKey ? (record[nameKey] || '').toString().trim() : '',
      candidateNumber: candidateNumberKey ? (record[candidateNumberKey] || '').toString().trim() : '',
      positions, // array of numbers or nulls (null = missing/unrecognized answer)
    };

    const chunk = (first ? '' : ',') + JSON.stringify(politician);
    outStream.write(chunk);
    first = false;
    count++;
  }
});

parser.on('end', () => {
  outStream.write(']');
  outStream.end();
  console.log(`Done — wrote ${count} politicians to ${outPath}`);
});

parser.on('error', (err) => {
  console.error('CSV parse error:', err);
});

input.pipe(parser);
