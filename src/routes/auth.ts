import { Router } from "express";
import * as controller from "../controllers/auth";
import { authorization } from "../middlewares/auth";
import { AUTH_PRIVILEDGE } from "../util/types";

const router = Router();

// ------------PUBLIC ROUTE------------
router.post("/login", controller.login);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

// -------RIDER PROTECTED ROUTE--------
router.post("/logout", authorization(AUTH_PRIVILEDGE.RIDER), controller.logout);

// -------ADMIN PROTECTED ROUTE--------
router.post("/add-rider", authorization(AUTH_PRIVILEDGE.ADMIN), controller.addRider)

export default router;
