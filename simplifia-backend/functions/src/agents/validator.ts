// ValidatorAgent - Validation des données avant soumission
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {VertexAIService} from "../services/vertex-ai";

/**
 * ValidatorAgent
 *
 * Responsabilité : Valider les données utilisateur avant soumission
 * - Vérifier formats (email, téléphone, code postal)
 * - Vérifier cohérence (dates, montants)
 * - Vérifier complétude (champs requis)
 * - Vérifier logique métier (revenus > 0, etc.)
 *
 * Pattern : Singleton
 */
export class ValidatorAgent {
  private static instance: ValidatorAgent;
  private vertexAI: VertexAIService;
  private firestore: FirebaseFirestore.Firestore;

  /**
   * Constructeur privé (Singleton)
   */
  private constructor() {
    this.vertexAI = new VertexAIService();
    this.firestore = getFirestore();
  }

  /**
   * Récupère l'instance unique du ValidatorAgent
   */
  public static getInstance(): ValidatorAgent {
    if (!ValidatorAgent.instance) {
      ValidatorAgent.instance = new ValidatorAgent();
    }
    return ValidatorAgent.instance;
  }

  /**
   * Valide les données avant soumission
   *
   * @param processId - ID du processus
   * @param mappedData - Données mappées à valider
   * @returns Résultat de validation avec erreurs/recommandations
   */
  async validateBeforeSubmission(
    processId: string,
    mappedData: any
  ): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      console.log(`✅ Validation démarrée pour processus ${processId}`);

      // Construire le prompt de validation
      const prompt = this.buildValidationPrompt(mappedData);

      // Appeler Vertex AI pour validation
      const response = await this.vertexAI.generateResponse("VALIDATOR", prompt);

      // Nettoyer et parser la réponse
      const cleanResponse = this.cleanJsonResponse(response);
      const validation: ValidationResult = JSON.parse(cleanResponse);

      const duration = Date.now() - startTime;

      // Logger le résultat dans Firestore
      await this.logValidation(processId, validation, duration);

      console.log(`✅ Validation terminée pour ${processId} - Valid: ${validation.valid} (${duration}ms)`);

      return validation;
    } catch (error) {
      console.error(`❌ Erreur validation pour ${processId}:`, error);

      // Logger l'erreur
      await this.logValidationError(processId, error);

      // Retourner validation échouée
      return {
        valid: false,
        errors: [
          {
            field: "system",
            message: `Erreur système de validation: ${error}`,
            severity: "critical",
          },
        ],
        recommendations: ["Veuillez réessayer ou contacter le support"],
        confidence: 0.0,
      };
    }
  }

  /**
   * Construit le prompt de validation pour Vertex AI
   */
  private buildValidationPrompt(mappedData: any): string {
    return `Tu es un validateur STRICT de données administratives françaises.

**DONNÉES À VALIDER :**
${JSON.stringify(mappedData, null, 2)}

**RÈGLES DE VALIDATION :**

1. **FORMATS** :
   - Email : format standard (xxx@yyy.zzz)
   - Téléphone : 10 chiffres (06/07 pour mobile, 01-05/09 pour fixe)
   - Code postal : 5 chiffres
   - Date : format valide et cohérent (pas dans le futur)

2. **COHÉRENCE** :
   - Dates : ordre logique (date naissance < date actuelle)
   - Montants : positifs et réalistes (revenus > 0, loyer < 10000€)
   - Relations : cohérence entre champs (ex: étudiant + revenus faibles)

3. **COMPLÉTUDE** :
   - Tous les champs "required: true" sont présents
   - Valeurs non vides (pas "", null, undefined)

4. **LOGIQUE MÉTIER** :
   - Revenus > 0 (sauf RSA)
   - Loyer < revenus * 3 (règle APL)
   - Âge >= 18 ans pour démarches administratives

**FORMAT DE RÉPONSE (JSON COMPACT sur UNE SEULE LIGNE) :**

{
  "valid": true/false,
  "errors": [
    {
      "field": "nom_du_champ",
      "message": "Description claire de l'erreur",
      "severity": "critical|warning"
    }
  ],
  "recommendations": [
    "Conseil pratique 1",
    "Conseil pratique 2"
  ],
  "confidence": 0.95
}

**RÈGLES SEVERITY :**
- "critical" : Bloque la soumission (format invalide, champ requis manquant)
- "warning" : N'empêche pas mais à corriger (montant élevé, incohérence mineure)

**EXEMPLE critical :**
Email "jean.dupontgmail.com" → severity: "critical", message: "Format email invalide (@ manquant)"

**EXEMPLE warning :**
Revenus 5000€ pour APL → severity: "warning", message: "Revenus élevés, vérifiez éligibilité APL"

Analyse les données et retourne UNIQUEMENT le JSON (pas de texte avant/après).`;
  }

  /**
   * Nettoie la réponse JSON de Vertex AI
   */
  private cleanJsonResponse(response: string): string {
    // Supprimer les markdown code blocks
    let cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    // Supprimer les retours à la ligne et espaces multiples
    cleaned = cleaned.replace(/\n/g, " ").replace(/\r/g, "");
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
  }

  /**
   * Log le résultat de validation dans Firestore
   */
  private async logValidation(
    processId: string,
    validation: ValidationResult,
    duration: number
  ): Promise<void> {
    try {
      const logData = {
        processId,
        timestamp: Timestamp.now(),
        agent: "ValidatorAgent",
        statut: validation.valid ? "success" : "error",
        message: validation.valid ?
          "✅ Validation réussie - Toutes les données sont valides" :
          `❌ ${validation.errors.filter((e) => e.severity === "critical").length} erreur(s) critique(s) détectée(s)`,
        details: validation.errors.length > 0 ?
          validation.errors
            .map((e) => `[${e.severity.toUpperCase()}] ${e.field}: ${e.message}`)
            .join("\n") :
          "Toutes les données sont valides",
        errorsCount: validation.errors.length,
        criticalErrorsCount: validation.errors.filter((e) => e.severity === "critical").length,
        warningsCount: validation.errors.filter((e) => e.severity === "warning").length,
        recommendations: validation.recommendations,
        confidence: validation.confidence,
        duration,
      };

      await this.firestore.collection("activity_logs").add(logData);

      console.log(`📝 Log validation créé pour processus ${processId}`);
    } catch (error) {
      console.error("❌ Erreur lors du logging validation:", error);
    }
  }

  /**
   * Log une erreur de validation dans Firestore
   */
  private async logValidationError(
    processId: string,
    error: any
  ): Promise<void> {
    try {
      await this.firestore.collection("activity_logs").add({
        processId,
        timestamp: Timestamp.now(),
        agent: "ValidatorAgent",
        statut: "error",
        message: "❌ Erreur système lors de la validation",
        details: String(error),
      });
    } catch (logError) {
      console.error("❌ Erreur lors du logging d'erreur:", logError);
    }
  }

  /**
   * Récupère l'historique de validation pour un processus
   */
  async getValidationHistory(processId: string): Promise<any[]> {
    try {
      const snapshot = await this.firestore
        .collection("activity_logs")
        .where("processId", "==", processId)
        .where("agent", "==", "ValidatorAgent")
        .get();

      const validations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Trier par timestamp desc
      validations.sort((a: any, b: any) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeB - timeA;
      });

      return validations;
    } catch (error) {
      console.error("❌ Erreur récupération historique validation:", error);
      return [];
    }
  }
}

/**
 * Interface du résultat de validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  recommendations: string[];
  confidence: number;
}

/**
 * Interface d'une erreur de validation
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: "critical" | "warning";
}

