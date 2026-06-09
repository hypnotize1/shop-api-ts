import Router from "express";
import {
  getUserProfile,
  loginUser,
  registerUser,
  logoutUser,
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

userRouter.post("/logout", protect, logoutUser);

userRouter.get("/profile", protect, getUserProfile);

export default userRouter;
