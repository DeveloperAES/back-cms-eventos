import express from "express";
import { crearAdmin, listarAdmins, actualizarAdmin, eliminarAdmin,  cambiarEstadoAdmin, loginAdmin, obtenerMisEventos } from "../controllers/adminsController.js";
import { verificarToken, autorizarRol } from "../middlewares/auth.js";

const router = express.Router();



// ✅ Ruta pública: login de admin
router.post("/login", loginAdmin);


// 🔒 Solo SAADMIN puede crear, listar o modificar admins
router.post("/", verificarToken, autorizarRol("saadmin"), crearAdmin);
router.get("/", verificarToken, autorizarRol("saadmin"), listarAdmins);
router.put("/:id", verificarToken, autorizarRol("saadmin"), actualizarAdmin);
router.delete("/:id", verificarToken, autorizarRol("saadmin"), eliminarAdmin);


router.put("/:id/estado", verificarToken, autorizarRol("saadmin"), cambiarEstadoAdmin);




// 🔒 Solo un admin autenticado puede ver sus eventos asignados
router.get("/mis-eventos", verificarToken, autorizarRol("admin"), obtenerMisEventos);
export default router;
