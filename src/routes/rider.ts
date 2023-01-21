import { Router } from "express";
import * as controller from "../controllers/rider";
import { authorization } from "../middlewares/auth";
import { AUTH_PRIVILEDGE } from "../util/types";

const router = Router();

// ------------PUBLIC ROUTE------------
router.post("/login", controller.login);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

// -------RIDER PROTECTED ROUTE--------
router.post("/logout", authorization(AUTH_PRIVILEDGE.ALL), controller.logout);

export default router;
