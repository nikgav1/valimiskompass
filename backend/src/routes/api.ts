import { Router } from "express";
import { POLITICIANS_JSON } from "../server";
import { checkJwt } from "../middlewares/auth";
import User from "../models/User";
// @ts-expect-error different path for Docker
import wasm from '../../wasm/pkg';

type PoliticianMatch = {
  party: string;
  name: string;
  candidateNumber: string;
  percent: number | null;
};

type MatchResult = Record<string, PoliticianMatch>;

const apiRouter = Router();

apiRouter.post('/evaluate', async (req, res) => {
  try {
    const answers: number[] = req.body.answers;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'answers must be an array' });
    }

    // call wasm function — it expects stringified JSON and returns stringified JSON
    const answersJson = JSON.stringify(answers);

    const resultJson = wasm.compute_matches(answersJson, POLITICIANS_JSON, 15);
    const results = JSON.parse(resultJson);

    res.status(200).json(results);
  } catch (err) {
    console.error('evaluate error:', err);
    res.status(500).json({ message: 'Could not evaluate politicians!', error: String(err) });
  }
});

apiRouter.post("/results", checkJwt, async (req, res) => {
  try {
    const data: PoliticianMatch[] = req.body.result;
    if (!Array.isArray(data)) {
      return res.status(400).json({ message: "Invalid payload: result must be an array" });
    }
    if (!req.auth?.payload.sub) {
      throw new Error("Invalid: missing sub");
    }

    const update = {
      $set: {
        result: data,
      },
      $setOnInsert: {
        firstSeenAt: new Date(),
      },
    };

    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    };

    const result = await User.findOneAndUpdate(
      { sub: req.auth.payload.sub },
      update,
      options
    ).exec();

    if (!result) {
      throw new Error("Failed to save results");
    }

    res.status(200).json({ message: "Saved results", resultId: result._id });
  } catch (err) {
    console.error("Error saving results:", err);
    res.status(500).json({
      message: "Could not save results",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

apiRouter.post("/public-results", async (req, res) => {
  try {
    if (!req.body.resultId) {
      return res.status(500).json({ message: "The resultId was not provided" });
    }
    const user = await User.findById(req.body.resultId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.result) {
      return res.status(404).json({ message: "No result provided in user" });
    }

    return res.status(200).json({
      result: user.result
    });

  } catch (err) {
    console.error("Error getting results:", err);
    res.status(500).json({
      message: "Could not get results",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

export default apiRouter;
