import { Router } from "express";
import * as controller from "../controllers/auth";
import { authorization } from "../middlewares/auth";

const router = Router();

// ------------PUBLIC ROUTE------------
router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

// ----------PROTECTED ROUTE-----------
router.post("/logout", authorization, controller.logout);

export default router;
