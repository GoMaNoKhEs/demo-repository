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
   * Helper pour créer un log détaillé d'action
   * Permet de créer des logs granulaires pour chaque micro-action
   *
   * @param processId - ID du processus
   * @param message - Message descriptif de l'action
   * @param type - Type de log (info, success, warning, error)
   * @param metadata - Métadonnées additionnelles
   */
  private async logDetailedAction(
    processId: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.firestore.collection("activity_logs").add({
        processId,
        type,
        message,
        timestamp: Timestamp.now(),
        agent: "ValidatorAgent",
        metadata: metadata || {},
      });
      console.log(`📝 [${type.toUpperCase()}] ${message}`);
    } catch (error) {
      console.error("❌ Erreur logging action détaillée:", error);
      // Ne pas bloquer le flux si le logging échoue
    }
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
   * ADAPTATIF : valide selon le type de démarche
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

      // LOG DÉTAILLÉ: Début de la validation
      await this.logDetailedAction(
        processId,
        `🔍 Début de la validation des données`,
        "info"
      );

      // 🔥 RÉCUPÉRER LE TYPE DE DÉMARCHE depuis Firestore
      const processDoc = await this.firestore.collection("processes").doc(processId).get();
      const processData = processDoc.data();
      const typeDemarche = processData?.type_demarche?.toLowerCase() || "generale";

      console.log(`📋 Type de démarche détecté: ${typeDemarche}`);

      // LOG DÉTAILLÉ: Type de démarche détecté
      await this.logDetailedAction(
        processId,
        `📋 Type de démarche: ${typeDemarche}`,
        "info",
        { typeDemarche }
      );

      // LOG DÉTAILLÉ: Nombre de champs à valider
      const fieldsCount = Object.keys(mappedData).length;
      await this.logDetailedAction(
        processId,
        `📊 Validation de ${fieldsCount} champs`,
        "info",
        { fieldsCount }
      );

      // Construire le prompt de validation ADAPTATIF
      const prompt = this.buildValidationPrompt(mappedData, typeDemarche);

      // LOG DÉTAILLÉ: Utilisation IA pour validation
      await this.logDetailedAction(
        processId,
        `🤖 Analyse intelligente avec IA`,
        "info"
      );

      // Appeler Vertex AI pour validation
      const response = await this.vertexAI.generateResponse("VALIDATOR", prompt);

      // Nettoyer et parser la réponse
      const cleanResponse = this.cleanJsonResponse(response);
      const validation: ValidationResult = JSON.parse(cleanResponse);

      const duration = Date.now() - startTime;

      // LOG DÉTAILLÉ: Résultat de validation
      if (validation.valid) {
        await this.logDetailedAction(
          processId,
          `✅ Validation réussie - Toutes les données sont conformes`,
          "success",
          { duration: `${duration}ms`, confidence: validation.confidence }
        );
      } else {
        const criticalErrors = validation.errors.filter((e) => e.severity === "critical");
        const warnings = validation.errors.filter((e) => e.severity === "warning");

        await this.logDetailedAction(
          processId,
          `❌ Validation échouée: ${criticalErrors.length} erreur(s) critique(s), ${warnings.length} avertissement(s)`,
          "error",
          { 
            criticalCount: criticalErrors.length,
            warningCount: warnings.length,
            duration: `${duration}ms`
          }
        );

        // LOG DÉTAILLÉ: Détail de chaque erreur critique
        for (const error of criticalErrors) {
          await this.logDetailedAction(
            processId,
            `   ❌ ${error.field}: ${error.message}`,
            "error",
            { field: error.field, severity: error.severity }
          );
        }

        // LOG DÉTAILLÉ: Détail de chaque warning
        for (const warning of warnings) {
          await this.logDetailedAction(
            processId,
            `   ⚠️ ${warning.field}: ${warning.message}`,
            "warning",
            { field: warning.field, severity: warning.severity }
          );
        }

        // LOG DÉTAILLÉ: Recommandations
        if (validation.recommendations && validation.recommendations.length > 0) {
          await this.logDetailedAction(
            processId,
            `💡 ${validation.recommendations.length} recommandation(s) suggérée(s)`,
            "info"
          );

          for (const recommendation of validation.recommendations) {
            await this.logDetailedAction(
              processId,
              `   💡 ${recommendation}`,
              "info"
            );
          }
        }
      }

      // Logger le résultat dans Firestore (log global)
      await this.logValidation(processId, validation, duration);

      console.log(`✅ Validation terminée pour ${processId} (${typeDemarche}) - Valid: ${validation.valid} (${duration}ms)`);

      return validation;
    } catch (error) {
      console.error(`❌ Erreur validation pour ${processId}:`, error);

      // LOG DÉTAILLÉ: Erreur système
      await this.logDetailedAction(
        processId,
        `❌ Erreur système lors de la validation: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        "error",
        { error: String(error) }
      );

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
   * Construit le prompt de validation ADAPTATIF selon le type de démarche
   */
  private buildValidationPrompt(mappedData: any, typeDemarche: string): string {
    // Champs de base communs à toutes les démarches
    const baseValidation = `
## FORMATS OBLIGATOIRES (Toutes démarches)

1. Email : xxx@yyy.zzz avec @ et domaine valide
2. Téléphone : exactement 10 chiffres (06/07 mobile, 01-05/09 fixe)
3. Code postal : exactement 5 chiffres (01000-99999)
4. Dates complètes : format ISO (YYYY-MM-DD) ou français (DD/MM/YYYY), cohérentes
5. Dates de naissance : entre 1900 et aujourd'hui
6. Date d'entrée logement (dateEntree) : format MM/YYYY (ex: "01/2025") OU DD/MM/YYYY OU YYYY-MM-DD
`;

    // Règles spécifiques selon le type de démarche
    let specificRules = "";

    if (typeDemarche.includes("apl") || typeDemarche.includes("logement")) {
      specificRules = `
## RÈGLES SPÉCIFIQUES APL

Champs obligatoires APL :
- nom, prenom, email, telephone, dateNaissance
- adresseComplete, ville, codePostal
- situation (propriétaire/locataire/hébergé)
- logement (appartement/maison/studio/colocation)
- loyer, charges, revenus
- nomBailleur, dateEntree, surfaceLogement

Règles métier APL :
- Loyer < Revenus × 3 (ratio d'endettement 33%)
- Revenus > 0 (obligatoire pour calcul APL)
- Situation = "locataire" (APL réservée aux locataires)
- Surface > 9m² (loi Carrez minimum)
- Date entrée < aujourd'hui (cohérence temporelle)
`;
    } else if (typeDemarche.includes("naissance") || typeDemarche.includes("déclaration")) {
      specificRules = `
## RÈGLES SPÉCIFIQUES NAISSANCE

Champs obligatoires Naissance :
- nom, prenom, email, telephone, dateNaissance
- adresseComplete, ville, codePostal, lieuNaissance
- nomEnfant, prenomEnfant, dateNaissanceEnfant, lieuNaissanceEnfant

Règles métier Naissance :
- Date naissance enfant < 5 jours (déclaration sous 5 jours)
- Date naissance enfant <= aujourd'hui
- Parent majeur (dateNaissance parent < aujourd'hui - 18 ans)
- Lieu naissance enfant = ville de l'hôpital/maternité
`;
    } else if (typeDemarche.includes("cni") || typeDemarche.includes("carte") || typeDemarche.includes("passeport")) {
      specificRules = `
## RÈGLES SPÉCIFIQUES CNI/PASSEPORT

Champs obligatoires CNI/Passeport :
- nom, prenom, email, telephone, dateNaissance, lieuNaissance
- adresseComplete, ville, codePostal
- numeroSecu (15 chiffres), taille (cm), couleurYeux
- photo (format ANTS), timbreFiscal (86€ pour passeport)

Règles métier ANTS :
- Photo < 6 mois (conformité ANTS)
- Taille entre 50 et 250 cm
- Numéro sécu : 15 chiffres avec structure valide (sexe+année+mois+dept+commune+ordre+clé)
- Timbre fiscal obligatoire pour passeport
`;
    } else if (typeDemarche.includes("rsa") || typeDemarche.includes("revenu") || typeDemarche.includes("aide")) {
      specificRules = `
## RÈGLES SPÉCIFIQUES RSA

Champs obligatoires RSA :
- nom, prenom, email, telephone, dateNaissance
- adresseComplete, ville, codePostal
- situation (célibataire/marié/pacsé/divorcé/veuf)
- revenus, charges, numeroSecu, numeroAllocataire, rib

Règles métier RSA :
- Revenus <= 607€/mois (montant forfaitaire RSA 2025)
- Revenus >= 0 (pas de revenus négatifs)
- Age >= 25 ans (condition RSA, sauf exceptions)
- RIB : IBAN français (FR + 25 chiffres) ou classique (23 chiffres)
- Numéro allocataire CAF : 7 chiffres
`;
    } else {
      specificRules = `
## RÈGLES GÉNÉRALES

Champs obligatoires minimum :
- nom, prenom, email, telephone
- adresseComplete, ville, codePostal

Validation de base uniquement (formats).
`;
    }

    return `Tu es un ValidatorAgent expert en validation de données administratives françaises.

${baseValidation}
${specificRules}

## COMPLÉTUDE
- Les champs obligatoires ne doivent PAS être vides, null ou undefined
- Vérifier la présence de TOUS les champs listés ci-dessus

## SÉVÉRITÉ
- "critical" : bloque la soumission (format invalide, champ manquant, règle métier violée)
- "warning" : valeur inhabituelle mais acceptée (ex: revenus élevés pour APL)

---

Données à valider (${typeDemarche}) :
\`\`\`json
${JSON.stringify(mappedData, null, 2)}
\`\`\`

Analyse et retourne UNIQUEMENT un JSON :
{
  "valid": boolean,
  "errors": [{"field": "xxx", "message": "...", "severity": "critical|warning"}],
  "recommendations": ["conseil 1", "conseil 2"],
  "confidence": 0.0-1.0
}

Exemples :
❌ CRITICAL - Email sans @ : {"field": "email", "message": "Format email invalide", "severity": "critical"}
⚠️ WARNING - Revenus élevés : {"field": "revenus", "message": "Revenus élevés, APL réduit", "severity": "warning"}
✅ VALID - Tout OK : {"valid": true, "errors": [], "recommendations": ["Données complètes"], "confidence": 1.0}

UNIQUEMENT le JSON (pas de texte avant/après).`;
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

