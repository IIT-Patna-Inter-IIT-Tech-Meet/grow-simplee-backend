import { Router } from "express";
import * as controllers from "../controllers/auth";

const router = Router();

router.post('/login', controllers.login);
router.post('/logout', controllers.logout);
router.post('/register', controllers.register);
router.post('/forgot-password', controllers.forgot_password);
router.post('/reset-password', controllers.reset_password);


export default router ;
