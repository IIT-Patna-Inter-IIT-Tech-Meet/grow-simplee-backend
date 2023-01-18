import { Router } from "express";
import * as controller from "../controllers/packages";

const router = Router();

router.post("/add", controller.add_package);
router.get("/get", controller.get_package);
router.get("get/filter", controller.get_package_with_filter);

export default router;
