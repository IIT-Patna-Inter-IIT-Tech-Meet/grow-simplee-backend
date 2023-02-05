import { Router } from "express";
import * as controller from "../controllers/routing";
import { authorization } from "../middlewares/auth";
import { AUTH_PRIVILEGE } from "../util/types";

const router = Router();

// ------------RIDER ROUTE------------
router.get("get-rider-route", authorization(AUTH_PRIVILEGE.ADMIN), controller.getRiderRoute);
router.get("get-route", authorization(AUTH_PRIVILEGE.RIDER), controller.getRoute);
router.get("get-all-routes", authorization(AUTH_PRIVILEGE.ADMIN), controller.getAllRoutes);

export default router;
