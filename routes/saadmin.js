import express from "express";
import { registrarSaadmin, loginSaadmin } from "../controllers/saadminController.js";

const router = express.Router();

router.post("/registro", registrarSaadmin);
router.post("/login", loginSaadmin);

export default router;
