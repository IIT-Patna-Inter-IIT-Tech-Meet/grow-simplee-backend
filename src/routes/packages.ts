import { Router } from "express";
import * as controller from "../controllers/packages";
import { authorization } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { AUTH_PRIVILEGE } from "../util/types";

const router = Router();

router.post(
    "/add",
    authorization(AUTH_PRIVILEGE.ADMIN),
    validate(controller.addPackageSchema),
    controller.addPackage
);
router.post(
    "/add-pickup",
    authorization(AUTH_PRIVILEGE.ADMIN),
    validate(controller.addPickupSchema),
    controller.addPickup
);
// Will have to see about its authorization
router.post(
    "/record-dimensions",
    validate(controller.recordDimensionsSchema),
    controller.recordDimensions
);
router.get(
    "/get-dimension-records",
    authorization(AUTH_PRIVILEGE.ADMIN),
    controller.getDimensionRecords
);

router.get("/get", authorization(AUTH_PRIVILEGE.ADMIN), controller.getPackage);
router.post(
    "/get/filter",
    authorization(AUTH_PRIVILEGE.ADMIN),
    validate(controller.getPackagesWithFilterSchema),
    controller.getPackagesWithFilter
);

router.get("/route-packages", authorization(AUTH_PRIVILEGE.RIDER), controller.getRoutePackages);
router.get("/rider-packages", authorization(AUTH_PRIVILEGE.ADMIN), controller.getRiderPackages);

export default router;
