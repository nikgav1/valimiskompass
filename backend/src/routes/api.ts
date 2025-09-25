import { Router } from "express";
import { computeMatchesFromJson } from "../services/matcher";
import politicians from "../../politicians.json";
import { checkJwt } from "../middlewares/auth";
import User from "../models/User";

type dataT = {
  [key: string]: number | null;
};

const apiRouter = Router();

apiRouter.post("/evaluate", (req, res) => {
  try {
    const answers: number[] = req.body.answers;
    const results = computeMatchesFromJson(answers, politicians);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: "Could not evaluate politicians!" });
  }
});

apiRouter.post("/results", checkJwt, async (req, res) => {
  try {
    const data: dataT = req.body.result;
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

    res.status(200).json({ message: "Saved results" });
  } catch (err) {
    console.error("Error saving results:", err);
    res.status(500).json({
      message: "Could not save results",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

export default apiRouter;
