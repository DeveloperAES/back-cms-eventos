// testAzure.js
import { BlobServiceClient } from "@azure/storage-blob";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config(); // Carga tu .env

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_BLOB_CONTAINER;

async function subirQR(nombreArchivo, buffer) {
  const blobService = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobService.getContainerClient(containerName);
  const blobClient = containerClient.getBlockBlobClient(nombreArchivo);

  await blobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: "image/png" },
  });

  return blobClient.url; // Devuelve la URL pública del blob
}

(async () => {
  try {
    // Reemplaza con cualquier imagen PNG de prueba
    const buffer = fs.readFileSync("./qr_test.png"); 
    const url = await subirQR("qr_prueba.png", buffer);
    console.log("✅ URL pública del blob:", url);
  } catch (err) {
    console.error("❌ Error subiendo blob:", err.message);
  }
})();
