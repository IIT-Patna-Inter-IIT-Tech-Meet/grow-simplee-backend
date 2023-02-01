import { Router } from "express";
import * as controller from "../controllers/packages";
import { authorization } from "../middlewares/auth";
import { AUTH_PRIVILEGE } from "../util/types";

const router = Router();

router.post("/add", authorization(AUTH_PRIVILEGE.ADMIN), controller.addPackage);
router.get("/get", authorization(AUTH_PRIVILEGE.ADMIN), controller.getPackage);
router.get("/get/filter", authorization(AUTH_PRIVILEGE.ADMIN), controller.getPackageWithFilter);

export default router;
