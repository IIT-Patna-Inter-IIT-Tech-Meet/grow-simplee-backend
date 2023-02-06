import { Router } from "express";
import * as controller from "../controllers/admin";
import { authorization } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { AUTH_PRIVILEGE } from "../util/types";

const router = Router();

// ------------PUBLIC ROUTE------------
router.post("/login", validate(controller.loginSchema), controller.login);

// -------ADMIN PROTECTED ROUTE--------
router.get("/get-admin", authorization(AUTH_PRIVILEGE.ADMIN), controller.getAdmin);
router.post("/logout", authorization(AUTH_PRIVILEGE.ADMIN), controller.logout);
router.post(
    "/add-rider",
    authorization(AUTH_PRIVILEGE.ADMIN),
    validate(controller.addRiderSchema),
    controller.addRider
);

router.get("/get-all-riders", authorization(AUTH_PRIVILEGE.ADMIN), controller.getAllRiders);
router.get(
    "/get-rider",
    authorization(AUTH_PRIVILEGE.ADMIN),
    validate(controller.getRiderSchema),
    controller.getRider
);
router.post(
    "/get-riders/filter",
    authorization(AUTH_PRIVILEGE.ADMIN),
    controller.getRidersWithFilters
);
router.get("/generate-routes", authorization(AUTH_PRIVILEGE.ADMIN), controller.formRoutes);

// ----SUPER ADMIN PROTECTED ROUTE-----
router.post(
    "/add-admin",
    authorization(AUTH_PRIVILEGE.SUPER_ADMIN),
    validate(controller.addAdminSchema),
    controller.addAdmin
);

export default router;
