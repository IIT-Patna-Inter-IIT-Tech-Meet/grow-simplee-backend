import { Router } from "express";
import * as controller from "../controllers/auth";

const router = Router();

router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.post('/register', controller.register);
router.post('/forgot-password', controller.forgot_password);
router.post('/reset-password', controller.reset_password);


export default router ;
