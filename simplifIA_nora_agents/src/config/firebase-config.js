// src/config/firebase-config.js
import admin from "firebase-admin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// ✅ Charge le fichier JSON de clé privée Firebase
const serviceAccount = require("../../config/simplifia-hackathon-firebase-adminsdk-fbsvc-0d0a863da3.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
