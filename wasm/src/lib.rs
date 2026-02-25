use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use std::collections::HashMap;

const EPS: f64 = 1e-12;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PoliticianJson {
    #[serde(default)]
    pub party: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    // accept both candidateNumber and candidate_number
    #[serde(default, alias = "candidateNumber")]
    pub candidate_number: Option<String>,
    // may contain nulls
    #[serde(default)]
    pub positions: Option<Vec<Option<f64>>>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PoliticianMatch {
    pub party: String,
    pub name: String,
    pub candidate_number: String,
    pub percent: Option<f64>,
}

#[wasm_bindgen]
pub fn compute_matches(
    answers_json: &str,
    politicians_json: &str,
    question_count: Option<usize>,
) -> Result<String, JsValue> {
    let answers: Vec<f64> = serde_json::from_str(answers_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid answers JSON: {e}")))?;
    let mut politicians: Vec<PoliticianJson> = serde_json::from_str(politicians_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid politicians JSON: {e}")))?;

    let qn = question_count.unwrap_or(answers.len());

    // Validate answers once
    if answers.len() != qn {
        return Err(JsValue::from_str(&format!(
            "answers must be an array of length {qn}"
        )));
    }
    for (i, &v) in answers.iter().enumerate() {
        if !(v.is_finite() && v >= -1.0 && v <= 1.0) {
            return Err(JsValue::from_str(&format!(
                "answers[{i}] must be a finite number in [-1,1]"
            )));
        }
    }

    // Pre-trim strings to reduce later work
    for p in &mut politicians {
        if let Some(ref mut s) = p.party { *s = s.trim().to_owned(); }
        if let Some(ref mut s) = p.name { *s = s.trim().to_owned(); }
        if let Some(ref mut s) = p.candidate_number { *s = s.trim().to_owned(); }
    }

    let mut out: HashMap<String, PoliticianMatch> = HashMap::with_capacity(politicians.len());

    for (idx, p) in politicians.into_iter().enumerate() {
        let party = p.party.unwrap_or_default();
        let name = p.name.unwrap_or_default();
        let candidate_number = p.candidate_number.unwrap_or_default();

        // key: prefer candidate_number, else name, else idx fallback
        let key = if !candidate_number.is_empty() {
            candidate_number.clone()
        } else if !name.is_empty() {
            name.clone()
        } else {
            format!("idx_{idx}")
        };

        let positions_opt = p.positions;
        // If name missing or positions absent percent: None
        if name.is_empty() || positions_opt.is_none() {
            out.insert(key, PoliticianMatch { party, name, candidate_number, percent: None });
            continue;
        }
        let positions = positions_opt.unwrap();

        let mut dot = 0.0f64;
        let mut sum_u2 = 0.0f64;
        let mut sum_p2 = 0.0f64;
        let mut had_overlap = false;

        for i in 0..qn {
            let p_raw = match positions.get(i) {
                Some(x) => x,
                None => continue,
            };
            let p_val = match p_raw {
                Some(v) => *v,
                None => continue,
            };
            if !(p_val.is_finite() && p_val >= -1.0 && p_val <= 1.0) {
                continue;
            }
            let u = unsafe { *answers.get_unchecked(i) };
            dot += u * p_val;
            sum_u2 += u * u;
            sum_p2 += p_val * p_val;
            had_overlap = true;
        }

        let percent = if !had_overlap {
            None
        } else {
            let denom = sum_u2.sqrt() * sum_p2.sqrt();
            if denom <= EPS {
                None
            } else {
                let score = (dot / denom).clamp(-1.0, 1.0);
                let pct = ((score + 1.0) * 50.0 * 100.0).round() / 100.0; // 2 decimals
                Some(pct)
            }
        };

        out.insert(
            key,
            PoliticianMatch {
                party,
                name,
                candidate_number,
                percent,
            },
        );
    }

    serde_json::to_string(&out)
        .map_err(|e| JsValue::from_str(&format!("Serialize error: {e}")))
}
