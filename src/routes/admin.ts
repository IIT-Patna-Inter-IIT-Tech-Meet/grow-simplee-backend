import { Router } from "express";
import * as controller from "../controllers/admin";
import { authorization } from "../middlewares/auth";
import { AUTH_PRIVILEGE } from "../util/types";

const router = Router();

// ------------PUBLIC ROUTE------------
router.post("/login", controller.login);

// -------ADMIN PROTECTED ROUTE--------
router.get("/get-admin", authorization(AUTH_PRIVILEGE.ADMIN), controller.getAdmin);
router.post("/logout", authorization(AUTH_PRIVILEGE.ADMIN), controller.logout);
router.post("/add-rider", authorization(AUTH_PRIVILEGE.ADMIN), controller.addRider);

// ----SUPER ADMIN PROTECTED ROUTE-----
router.post("/add-admin", authorization(AUTH_PRIVILEGE.SUPER_ADMIN), controller.addAdmin);

export default router;
