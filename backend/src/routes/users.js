import Router from "express";
const router = Router();
import { login, register } from "../controllers/users.js";

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity");
router.route("get_all_activity");

export default router;