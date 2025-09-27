use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

const EPS: f64 = 1e-12;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PoliticianJson {
    pub party: Option<String>,
    pub name: Option<String>,
    pub candidate_number: Option<String>, // we'll accept camelCase too in JSON
    // positions may contain nulls so Option<Vec<Option<f64>>>
    pub positions: Option<Vec<Option<f64>>>,
}

// make JSON-friendly output
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PoliticianMatch {
    pub party: String,
    pub name: String,
    pub candidate_number: String,
    pub percent: Option<f64>,
}

// We'll accept JSON strings in and return a JSON string out so binding is trivial.
#[wasm_bindgen]
pub fn compute_matches(answers_json: &str, politicians_json: &str, question_count: Option<usize>) -> Result<String, JsValue> {
    // parse input
    let answers: Vec<f64> = serde_json::from_str(answers_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid answers JSON: {}", e)))?;
    // For politician JSON, we want flexible key names. We'll try to parse to Vec<serde_json::Value>
    let raw_pol: serde_json::Value = serde_json::from_str(politicians_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid politicians JSON: {}", e)))?;
    let politicians: Vec<PoliticianJson> = serde_json::from_value(raw_pol)
        .map_err(|e| JsValue::from_str(&format!("Invalid politicians structure: {}", e)))?;

    let question_count = question_count.unwrap_or(answers.len());

    // validate answers length
    if answers.len() != question_count {
        return Err(JsValue::from_str(&format!("answers must be an array of length {}", question_count)));
    }
    // validate answers values
    for (i, &v) in answers.iter().enumerate() {
        if !v.is_finite() || v < -1.0 || v > 1.0 {
            return Err(JsValue::from_str(&format!("answers[{}] must be a finite number in [-1,1]", i)));
        }
    }

    let mut result: std::collections::BTreeMap<String, PoliticianMatch> = std::collections::BTreeMap::new();

    for (idx, p) in politicians.into_iter().enumerate() {
        let party = p.party.unwrap_or_else(|| "".to_string()).trim().to_string();
        let name = p.name.unwrap_or_else(|| "".to_string()).trim().to_string();
        // candidateNumber field originally camelCase; we used candidate_number. Try both forms via serde mapping or just use deserialized value.
        let candidate_number = p.candidate_number.unwrap_or_else(|| "".to_string()).trim().to_string();

        let key = if !candidate_number.is_empty() {
            candidate_number.clone()
        } else if !name.is_empty() {
            name.clone()
        } else {
            format!("idx_{}", idx)
        };

        // validate positions
        let positions_opt = p.positions;
        if positions_opt.is_none() || name.is_empty() {
            result.insert(key.clone(), PoliticianMatch {
                party,
                name,
                candidate_number,
                percent: None
            });
            continue;
        }
        let positions = positions_opt.unwrap();

        // build paired vectors
        let mut u_vec: Vec<f64> = Vec::new();
        let mut p_vec: Vec<f64> = Vec::new();

        for i in 0..question_count {
            let p_raw = positions.get(i);
            match p_raw {
                Some(opt) => {
                    if let Some(p_val) = opt {
                        if !p_val.is_finite() || *p_val < -1.0 || *p_val > 1.0 {
                            // skip invalid politician value
                            continue;
                        }
                        let u_val = answers[i];
                        u_vec.push(u_val);
                        p_vec.push(*p_val);
                    } else {
                        // politician answer was null -> skip
                        continue;
                    }
                }
                None => continue, // politician has no value at this index -> skip
            }
        }

        if p_vec.is_empty() {
            result.insert(key.clone(), PoliticianMatch {
                party,
                name,
                candidate_number,
                percent: None
            });
            continue;
        }

        // norms
        let mut sum_u2 = 0.0_f64;
        let mut sum_p2 = 0.0_f64;
        for i in 0..p_vec.len() {
            sum_u2 += u_vec[i] * u_vec[i];
            sum_p2 += p_vec[i] * p_vec[i];
        }
        let norm_u = sum_u2.sqrt();
        let norm_p = sum_p2.sqrt();

        if norm_u <= EPS || norm_p <= EPS {
            result.insert(key.clone(), PoliticianMatch {
                party,
                name,
                candidate_number,
                percent: None
            });
            continue;
        }

        // dot of normalized vectors
        let mut dot = 0.0_f64;
        for i in 0..p_vec.len() {
            dot += (u_vec[i] / norm_u) * (p_vec[i] / norm_p);
        }

        let score = dot.max(-1.0).min(1.0);
        let mut percent = ((score + 1.0) / 2.0) * 100.0;
        // round to 2 decimals
        percent = (percent * 100.0).round() / 100.0;

        result.insert(key.clone(), PoliticianMatch {
            party,
            name,
            candidate_number,
            percent: Some(percent)
        });
    }

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
}
