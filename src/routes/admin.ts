import { Router } from "express";
import * as controller from "../controllers/admin";
import { authorization } from "../middlewares/auth";
import { AUTH_PRIVILEDGE } from "../util/types";

const router = Router();

// ------------PUBLIC ROUTE------------
router.post("/login", controller.login);

// -------ADMIN PROTECTED ROUTE--------
router.post("/logout", authorization(AUTH_PRIVILEDGE.ALL), controller.logout);
router.post("/add-rider", authorization(AUTH_PRIVILEDGE.ADMIN), controller.addRider);

// ----SUPER ADMIN PROTECTED ROUTE-----
router.post("/add-admin", authorization(AUTH_PRIVILEDGE.SUPER_ADMIN), controller.addAdmin);

export default router;
