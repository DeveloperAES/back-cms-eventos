import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

const containerName = process.env.AZURE_BLOB_CONTAINER;

const blobService = BlobServiceClient.fromConnectionString(connectionString);

/**
 * Sube un archivo PNG al contenedor especificado.
 * Devuelve la URL pública del blob.
 */
export async function subirQR(nombreArchivo, buffer) {
  const containerClient = blobService.getContainerClient(containerName);
  const blobClient = containerClient.getBlockBlobClient(nombreArchivo);

  await blobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: "image/png" },
  });

  return blobClient.url; // URL pública
}
