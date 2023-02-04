import fs from "fs";
import { config } from "dotenv";

// Not the best way to check if environment exists
// But meh!
if (fs.existsSync(".env")) {
    // console.error("[#] ERROR: .env file doesn't seem to exist!");
    // throw ".env file doesn't exist";
    console.log("[@] Found `.env` file, assuming Environment variables exist");
    config();
}

// Get Environment Variables

export const ENVIRONMENT = process.env.NODE_ENV;
export const __prod__ = ENVIRONMENT === "production";

export const PORT = Number(process.env.PORT) || 5000;
export const CLIENT_URL = process.env.CLIENT_URL;
export const TOKEN_SECRET = process.env.TOKEN_SECRET || "random_secret";

// TODO: secure being true is hard to implement perhaps
export const COOKIE_CONFIG = {
    httpOnly: true,
    secure: __prod__,
};

export const MAILING_EMAIL = process.env.MAILING_EMAIL;
export const MAILING_PASSWORD = process.env.MAILING_PASSWORD;

export const REDIS_URL = process.env.REDIS_URL;

export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
export const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
