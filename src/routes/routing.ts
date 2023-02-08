import { Router } from "express";
import * as controller from "../controllers/routing";
import { authorization } from "../middlewares/auth";
import { validate } from "../middlewares/validation";
import { AUTH_PRIVILEGE } from "../util/types";

const router = Router();

// ------------RIDER ROUTE------------
router.get(
    "/get-rider-route",
    authorization(AUTH_PRIVILEGE.ADMIN),
    validate(controller.getRiderRouteSchema),
    controller.getRiderRoute
);
router.get("/get-route", authorization(AUTH_PRIVILEGE.RIDER), controller.getRoute);
router.get("/get-all-routes", authorization(AUTH_PRIVILEGE.ADMIN), controller.getAllRoutes);
router.get("/generate-route-stats", authorization(AUTH_PRIVILEGE.ADMIN), controller.generateStats);

export default router;
