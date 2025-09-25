import config from "./config/config";
import mongoose from "mongoose";
import app from "./app";

(async () => {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } else {
    process.exit(1)
  }
})();
