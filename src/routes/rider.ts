import { Router } from "express";
import * as controller from "../controllers/rider";
import { authorization } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { AUTH_PRIVILEGE } from "../util/types";

const router = Router();

// ------------PUBLIC ROUTE------------
router.post("/login", validate(controller.loginSchema), controller.login);
router.post(
    "/forgot-password",
    validate(controller.forgotPasswordSchema),
    controller.forgotPassword
);
router.post("/reset-password", validate(controller.resetPasswordSchema), controller.resetPassword);

// -------RIDER PROTECTED ROUTE--------
router.post("/logout", authorization(AUTH_PRIVILEGE.RIDER), controller.logout);
router.get("/get-rider", authorization(AUTH_PRIVILEGE.RIDER), controller.getRider);
router.post(
    "/update",
    authorization(AUTH_PRIVILEGE.RIDER),
    validate(controller.updateRiderSchema),
    controller.updateRider
);

export default router;
