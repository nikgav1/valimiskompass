import 'dotenv/config';
import fs from 'fs';
import { Readable } from 'stream';
import { parse } from 'csv-parse';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'eu-north-1' });

function findKeyByFragments(recordKeys, fragments) {
  return recordKeys.find(k =>
    fragments.some(f => k && k.toString().toLowerCase().includes(f.toLowerCase()))
  );
}

function mapAnswerToNumber(raw) {
  if (raw === undefined || raw === null) return null;
  const s = raw.toString().trim().toLowerCase();
  if (!s) return null;

  if (s.includes('ei nõustu üldse') || s.includes('полностью не согласен') || s.includes('ei nõustu täielikult')) return -1;
  if (s.includes('ei nõustu') || s.includes('не согласен')) return -0.5;
  if (s.includes('neutraal') || s.includes('нейтра')) return 0;
  if (s.includes('täielikult') || s.includes('полностью согласен') || s.includes('nõustun täielikult')) return 1;
  if (s.includes('nõustun') || s.includes('согласен')) return 0.5;

  if (s === '-1' || s === '-1.0') return -1;
  if (s === '-0.5' || s === '-0,5') return -0.5;
  if (s === '0' || s === '0.0') return 0;
  if (s === '0.5' || s === '0,5') return 0.5;
  if (s === '1' || s === '1.0') return 1;

  return null;
}

async function streamFromS3Body(body) {
  if (!body) throw new Error('Empty S3 body');
  if (body instanceof Readable) return body;
  if (typeof body[Symbol.asyncIterator] === 'function') return Readable.from(body);
  // fallback: treat as buffer-like
  return Readable.from([body]);
}

/**
 * Download CSV from S3 and write local JSON file (streaming).
 * @param {{bucket: string, key: string, outPath: string}} opts
 */
export async function downloadCsvFromS3AndWriteJson(opts) {
  const { bucket, key, outPath } = opts;
  if (!bucket || !key || !outPath) throw new Error('bucket, key and outPath are required');

  const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const resp = await s3Client.send(getCmd);
  const s3BodyStream = await streamFromS3Body(resp.Body);

  const parser = parse({ columns: true, skip_empty_lines: true, relax_column_count: true });
  const outStream = fs.createWriteStream(outPath, { encoding: 'utf8' });

  outStream.write('[');
  let first = true;
  let count = 0;

  const ignoreFragments = [
    'Erakond','Партия','valimisnimekiri',
    'Eesnimi','perekonnanimi','Имя','фамилия',
    'Kandidaadi number','Номер кандидата',
    'Ajatempel','Timestamp','newField'
  ];

  const parsePromise = new Promise((resolve, reject) => {
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        const keys = Object.keys(record || {});

        const partyKey = findKeyByFragments(keys, ['Erakond', 'Партия', 'valimisnimekiri']);
        const nameKey = findKeyByFragments(keys, ['Eesnimi', 'perekonnanimi', 'Имя', 'фамилия']);
        const candidateNumberKey = findKeyByFragments(keys, ['Kandidaadi number', 'Номер кандидата']);

        const positions = [];
        for (const k of keys) {
          const shouldIgnore = ignoreFragments.some(f => k && k.toString().toLowerCase().includes(f.toLowerCase()));
          if (shouldIgnore) continue;
          if (!k || k.trim() === '') continue;

          const raw = record[k];
          const mapped = mapAnswerToNumber(raw);
          positions.push(mapped);
        }

        const politician = {
          party: partyKey ? (record[partyKey] || '').toString().trim() : '',
          name: nameKey ? (record[nameKey] || '').toString().trim() : '',
          candidateNumber: candidateNumberKey ? (record[candidateNumberKey] || '').toString().trim() : '',
          positions
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
      resolve();
    });

    parser.on('error', err => {
      reject(err);
    });
  });

  // pipe S3 body into CSV parser
  s3BodyStream.pipe(parser);

  await parsePromise;
  console.log(`Done — wrote ${count} politicians to ${outPath}`);
}

if (process.argv[1] && process.argv[1].endsWith('csv-to-json.js')) {
  (async () => {
    try {
      await downloadCsvFromS3AndWriteJson({
        bucket: 'my-politicians-data-2025',
        key: 'politicians.csv',
        outPath: './politicians.json'
      });
    } catch (err) {
      console.error('Error:', err);
      process.exitCode = 1;
    }
  })();
}