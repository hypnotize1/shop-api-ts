import { Request, Response } from "express";
import { IUser } from "../interfaces/user.interface.js";
import User from "../models/user.model.js";
import { genSalt, hash, compare } from "bcrypt-ts";
import jwt from "jsonwebtoken";
import { CustomRequest } from "../middlewares/auth.middleware.js";
import { AppError } from "../utils/appError.js";

type RegisterUserRequest = Request<any, any, IUser>;

/**
 * @desc    Register a new user
 * @route   POST /api/user/register
 * @access  Public
 */
export const registerUser = async (req: RegisterUserRequest, res: Response) => {
  const { name, email, age, password } = req.body;

  // Validation for checking inputs and their values
  if (!name || !email || age === undefined || !password) {
    throw new AppError("Please provide all fields!", 400);
  }

  // Check the email duplication
  const isUserExist = await User.findOne({ email });
  if (isUserExist) {
    throw new AppError("Email Exist!", 400);
  }

  // Hash the password
  const salt = await genSalt(12);
  const hashedPassword = await hash(password, salt);

  // Register user in database
  const newUser = await User.create({
    name,
    email,
    age,
    password: hashedPassword,
  });

  // Send response
  res.status(201).json({ message: "User created successfully!", newUser });
};

/**
 * @desc    Login a user
 * @route   POST /api/user/login
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find user with an email
  const isUserExist = await User.findOne({ email });

  // Check for existence of user
  if (!isUserExist) {
    throw new AppError("Invalid email or password!", 404);
  }

  const isSimilar = await compare(password, isUserExist.password);

  // Check passwords
  if (!isSimilar) {
    throw new AppError("Invalid email or password", 400);
  }
  // Create tokens for user
  const accessSecret = process.env.JWT_ACCESS_TOKEN!;
  const refreshSecret = process.env.JWT_REFRESH_TOKEN!;

  const accessToken = jwt.sign(
    { id: isUserExist.id, role: isUserExist.role },
    accessSecret,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign({ id: isUserExist.id }, refreshSecret, {
    expiresIn: "30d",
  });

  // Save refresh token in database
  isUserExist.refreshToken = refreshToken;
  await isUserExist.save();

  res
    .status(200)
    .json({ message: "Login successfully!", refreshToken, accessToken });
};

/**
 * @desc    Get user profile information
 * @route   GET /api/user/profile
 * @access  Private
 */
export const getUserProfile = async (req: CustomRequest, res: Response) => {
  const userId = req.user.id;

  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new AppError("User not found!", 404);
  }

  return res.status(200).json({ user });
};

/**
 * @desc    Logout user & invalidate refresh token
 * @route   POST /api/user/logout
 * @access  Private
 */
export const logoutUser = async (req: CustomRequest, res: Response) => {
  const userId = req.user.id;

  // Find user and delete refresh token from database
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found!", 404);
  }

  user.refreshToken = undefined;
  await user.save();

  return res
    .status(200)
    .json({ message: "Logged out successfully! token invalidated." });
};
