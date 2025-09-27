import mongoose from "mongoose";

type PoliticianMatch = {
  party: string;
  name: string;
  candidateNumber: string;
  percent: number | null;
};

type userT = {
  sub: string;
  result: PoliticianMatch[];
};

const politicianSchema = new mongoose.Schema<PoliticianMatch>({
  party: { type: String, default: "" },
  name: { type: String, required: true },
  candidateNumber: { type: String, default: "" },
  percent: { type: Number, default: null },
}, { _id: false });

const userSchema = new mongoose.Schema<userT>({
  sub: { type: String, required: true, unique: true },
  result: { type: [politicianSchema], required: true, default: [] }
});

const User = mongoose.model<userT>("User", userSchema);
export default User;