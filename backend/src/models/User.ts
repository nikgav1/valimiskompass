import mongoose from "mongoose";

type ResultData = {
    [key: string]: number | null;
}

type userT = {
    sub: string;
    result: ResultData;
}

const userSchema = new mongoose.Schema<userT>({
    sub: { type: String, required: true },
    result: {
        type: Map,
        of: Number,
        required: true,
        default: {}
    }
});

const User = mongoose.model<userT>('User', userSchema);
export default User;