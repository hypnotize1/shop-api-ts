import { IUser } from "../interfaces/user.interface.js";
import { Schema, model } from "mongoose";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, trim: true, minlength: 8 },
    role: {
      type: String,
      required: true,
      enum: ["user", "admin"],
      default: "user",
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true },
);

const User = model<IUser>("User", userSchema);

export default User;
