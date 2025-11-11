import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import saadminRoutes from "./routes/saadmin.js";
import adminsRoutes from "./routes/admins.js";
import eventosRoutes from "./routes/eventos.js";
import asignacionesRoutes from "./routes/asignaciones.js";
import usuariosRoutes from "./routes/usuarios.js";
import registroRoutes from "./routes/registros.js";

dotenv.config();
const app = express();

// ✅ Middleware CORS (permite todo en desarrollo)
app.use(cors());

// Middleware JSON
app.use(express.json());

// ✅ Rutas
app.use("/api/saadmin", saadminRoutes);
app.use("/api/admins", adminsRoutes);

app.use("/api/eventos", eventosRoutes);
app.use("/api/asignaciones", asignacionesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/registros", registroRoutes);



// Ruta base
app.get("/", (req, res) => {
  res.send("✅ SuperCMS Backend corriendo correctamente");
});

// Servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
