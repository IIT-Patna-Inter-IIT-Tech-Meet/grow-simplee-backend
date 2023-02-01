import { Router } from "express";
import * as controller from "../controllers/routing";
import { authorization } from "../middlewares/auth";
import { AUTH_PRIVILEGE } from "../util/types";

const router = Router();

// ------------RIDER ROUTE------------
router.post("get-route", authorization(AUTH_PRIVILEGE.RIDER), controller.getRoute);

export default router;
