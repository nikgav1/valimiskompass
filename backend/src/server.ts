import mongoose from "mongoose";
import politicians from "../politicians.json";
import app from "./app";
import { env } from "./config/env";

(async () => {
  await mongoose.connect(env.mongodbUri);

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
})();

export const POLITICIANS_JSON = JSON.stringify(politicians);
