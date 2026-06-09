export interface IUser {
  name: string;
  age: number;
  email: string;
  password: string;
  role: "user" | "admin";
  refreshToken?: String;
}
