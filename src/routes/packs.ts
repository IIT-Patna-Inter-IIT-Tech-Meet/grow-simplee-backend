import { Router } from "express";
import * as controllers from "../controllers/packs";

const router = Router();

router.post('/add', controllers.add_package);
router.get('/get', controllers.get_package);
router.get('get/filter', controllers.get_package_with_filter);

export default router ;