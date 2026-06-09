import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError.js";
import { IUser } from "../interfaces/user.interface.js";
import User from "../models/user.model.js";

/**
 * Extended Express Request interface to attach authenticated user payload.
 */
export interface CustomRequest extends Request {
  user?: IUser;
}

/**
 * @desc    Strict authentication guard. Blocks request if a valid AT is missing.
 * @throws  {AppError} 401 - If token is missing, invalid, or expired.
 */
export const protect = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  let token: string | undefined;

  // Extract token from Authorization header (Bearer schema)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Split token from Bearer work
      token = req.headers.authorization.split(" ")[1];

      // Verify token integrity and expiration against environment secret
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN!) as {
        id: string;
        role: string;
      };

      // Find user in database from user id
      const currentUser = await User.findById(decoded.id);

      // If user has deleted account , deny
      if (!currentUser) {
        return next(
          new AppError(
            "The user belonging to this token no longer exist.",
            404,
          ),
        );
      }

      // Attach decoded payload to request object for downstream controllers
      req.user = currentUser;
      return next();
    } catch (err) {
      // Forward token validation failures to the global error handler
      return next(new AppError("Invalid or expired access token!", 401));
    }
  }

  // Enforce authentication if no token was extracted
  if (!token) {
    return next(new AppError("Authentication required. Token not found!", 401));
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
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return next(new AppError("Access denied. Admin privileges required!", 403));
};

/**
 * @desc    Lenient authentication middleware. Populates req.user if token is valid,
 * but gracefully passes the request downstream if unauthenticated.
 */
export const optionalProtect = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN!) as {
        id: string;
        role: string;
      };

      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next(
          new AppError(
            "The user belonging to this token no longer exist.",
            404,
          ),
        );
      }

      req.user = currentUser;

      return next();
    } catch (err) {
      // Silently discard invalid tokens and proceed as a guest user
      req.user = undefined;
      return next();
    }
  }

  // Proceed as a guest user if no token is presented
  if (!token) {
    req.user = undefined;
    return next();
  }
};
