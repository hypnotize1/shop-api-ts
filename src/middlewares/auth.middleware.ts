import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError.js";
import { IUser } from "../interfaces/user.interface.js";
import User from "../models/user.model.js";
import logger from "../utils/logger.js";

/**
 * Extended Express Request interface to attach authenticated user payload.
 */
export interface CustomRequest extends Request {
  user?: IUser;
}

const verifyToken = async (token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN!) as {
    id: string;
  };
  const user = await User.findById(decoded.id);
  if (!user)
    throw new AppError(
      "The user belonging to this token no longer exist.",
      404,
    );
  return user;
};

/**
 * @desc    Strict authentication guard. Blocks request if a valid AT is missing.
 * @throws  {AppError} 401 - If token is missing, invalid, or expired.
 */
export const protect = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    // Extract token from Authorization header (Bearer schema)
    if (!authHeader?.startsWith("Bearer")) {
      throw new AppError("Authentication required. Token not found!", 401);
    }

    // Split token from Bearer work
    const token = authHeader.split(" ")[1];

    // Attach decoded payload to request object for downstream controllers
    req.user = await verifyToken(token);
    return next();
  } catch (err) {
    // Forward token validation failures to the global error handler
    logger.warn(
      `Failed authentication attempt: ${err instanceof Error ? err.message : "Unknown error"}`,
    );

    next(
      err instanceof AppError
        ? err
        : new AppError("invalid or expired access token!", 401),
    );
  }
};

/**
 * @desc    Role-based authorization guard for administrative privileges.
 * @throws  {AppError} 403 - If the authenticated user is not an admin.
 */
export const admin = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  // Ensure user identity exists and possesses admin privileges
  if (req.user?.role !== "admin") {
    logger.warn(`Unathorized admin access attempt by user: ${req.user?.id}`);
    return next(new AppError("Access denied. Admin privilages required!", 403));
  }
  next();
};

/**
 * @desc   Lenient authentication middleware. Populates req.user if token is valid,
 * but gracefully passes the request downstream if unauthenticated.
 */
export const optionalProtect = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      req.user = await verifyToken(token);
    }
  } catch (err) {
    logger.info("Optional auth failed, proceeding as guest.");
    req.user = undefined;
  }
  next();
};
