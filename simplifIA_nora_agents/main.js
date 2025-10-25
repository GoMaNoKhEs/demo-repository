// Point d’entrée : exécute les agents dans l’ordre logique
import { runAnalyzer } from "./src/ai-analyzer.js";
import { runNavigator } from "./src/ai-navigator.js";
import { runFormFiller } from "./src/ai-form-filler.js";
import { runValidator } from "./src/ai-validator.js";
import { runChat } from "./src/ai-chat.js";
import { runMonitor } from "./src/ai-monitor.js";


const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
console.log("=== SimplifIA multi-agents demo ===\n");

await runAnalyzer("Je pars en Espagne le 15 juin pour 2 semaines");
await wait(100);
await runNavigator();
await runFormFiller();
await runValidator();
await runChat("Où en est ma demande ?");
await runMonitor();

console.log("\n Fin de la démo SimplifIA"); 

