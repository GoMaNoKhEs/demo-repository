// test-vertex.js
import { VertexAI } from "@google-cloud/vertexai";

const PROJECT_ID = "simplifia-hackathon";
const LOCATION = "us-central1"; // région la plus stable pour Gemini
const MODEL = "gemini-2.5-flash"; //  modèle bien présent dans ta console

async function testGemini() {
  const vertex = new VertexAI({ project: PROJECT_ID, location: LOCATION });
  const model = vertex.preview.getGenerativeModel({ model: MODEL });

  const prompt = "Dis bonjour à Nora et explique ton rôle en une phrase.";

  const result = await model.generateContent(prompt);

  console.log("\n🧠 Réponse de Gemini :\n");

  // nouvelle structure de réponse (Gemini 2.x)
  if (result.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.log(result.response.candidates[0].content.parts[0].text);
  } else if (result.response?.text) {
    console.log(result.response.text());
  } else {
    console.log(result);
  }
}

testGemini().catch(console.error);
