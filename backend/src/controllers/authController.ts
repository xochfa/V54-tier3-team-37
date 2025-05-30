import { Request, Response } from "express";
import { githubAuth, googleAuth } from "../services/index.js";

import {
  LOGGED_IN_REACT_ADDRESS,
  HOME_REACT_ADDRESS,
  cookieOptions,
} from "../config/index.js";
import { generateToken, generateRandomHexString } from "../utils/index.js";
import { GSession, User } from "../types/index.js";

const handleSignIn = async (
  req: Request,
  res: Response,
  authService: typeof googleAuth | typeof githubAuth,
  authProvider: string
) => {
  try {
    const state = generateRandomHexString();
    (req.session as GSession)[authProvider] = state;
    // Generate a url that asks permissions defined scopes
    const authorizationUrl = authService.generateAuthUrl(state);
    if (!authorizationUrl) {
      res.status(500).json({ error: "Failed to redirect to OAuth interface" });
      return;
    }

    // Redirect the user to authorizationUrl
    res.redirect(authorizationUrl);
  } catch (error) {
    console.error(error);
    res.end(error);
  }
};

const handleCallback = async (
  req: Request,
  res: Response,
  authService: typeof googleAuth | typeof githubAuth,
  authProvider: string
) => {
  try {
    const user = await authService.authenticate(req);
    if (!user) return;
    sendCookieAndRedirect(res, user, authProvider);
  } catch (error) {
    console.error(error);
    const redirectUrl = `${HOME_REACT_ADDRESS}/?error=${error}`;
    res.redirect(String(redirectUrl));
  } finally {
    (req.session as GSession)[authProvider] = "";
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // clear user session
    res.clearCookie("token", cookieOptions);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
};

// =======================================
// GitHub
// =======================================
export const githubSignIn = async (req: Request, res: Response) => {
  handleSignIn(req, res, githubAuth, "github");
};

export const githubCallback = async (req: Request, res: Response) => {
  handleCallback(req, res, githubAuth, "github");
};

// =======================================
// Google
// =======================================
export const googleSignIn = async (req: Request, res: Response) => {
  handleSignIn(req, res, googleAuth, "google");
};

export const googleCallback = async (req: Request, res: Response) => {
  handleCallback(req, res, googleAuth, "google");
};

// =======================================
// Send cookie and redirect to React
// =======================================
const sendCookieAndRedirect = (res: Response, user: User, authProvider: string) => {
  try {
    const token = generateToken(user);
    res.cookie("token", token, cookieOptions);
    res.header("Authorization", `Bearer ${token}`); // Fallback for privacy blockers
    res.redirect(`${LOGGED_IN_REACT_ADDRESS}?authProvider=${authProvider}`);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
};
