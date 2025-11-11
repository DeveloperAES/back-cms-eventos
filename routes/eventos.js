import express from "express";
import { crearEvento, listarEventos, actualizarEvento, cambiarEstadoEvento, eliminarEvento, obtenerEventoPorSlug } from "../controllers/eventosController.js";
import { verificarToken, autorizarRol } from "../middlewares/auth.js";


const router = express.Router();

router.post("/", verificarToken, autorizarRol("saadmin"), crearEvento);
router.get("/", verificarToken, autorizarRol("saadmin"), listarEventos);

router.put("/:id", verificarToken, autorizarRol("saadmin"), actualizarEvento);
router.patch("/:id/estado", verificarToken, autorizarRol("saadmin"), cambiarEstadoEvento);
router.delete("/:id", verificarToken, autorizarRol("saadmin"), eliminarEvento);

router.get("/slug/:slug", obtenerEventoPorSlug);






export default router;
