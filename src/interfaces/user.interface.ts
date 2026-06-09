import { Document } from "mongoose";
export interface IUser extends Document {
  id: string;
  name: string;
  age: number;
  email: string;
  password: string;
  role: "user" | "admin";
  refreshToken?: String;
}
