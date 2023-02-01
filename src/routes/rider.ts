import { Router } from "express";
import * as controller from "../controllers/rider";
import { authorization } from "../middlewares/auth";
import { AUTH_PRIVILEGE } from "../util/types";

const router = Router();

// ------------PUBLIC ROUTE------------
router.post("/login", controller.login);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

// -------RIDER PROTECTED ROUTE--------
router.post("/logout", authorization(AUTH_PRIVILEGE.RIDER), controller.logout);
router.get("/get-rider", authorization(AUTH_PRIVILEGE.RIDER), controller.getRider);

export default router;
