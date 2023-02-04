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

export default router;
