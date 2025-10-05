import mongoose from "mongoose";

type algorithmT = {
    name: string;
    usedCount: number;
    lastUsedAt: Date;
}

const algorithmLogSchema = new mongoose.Schema<algorithmT>({
  name: { type: String, required: true, unique: true },
  usedCount: { type: Number, default: 0 },
  lastUsedAt: { type: Date, default: Date.now }
});

export default mongoose.model<algorithmT>("AlgorithmLog", algorithmLogSchema);