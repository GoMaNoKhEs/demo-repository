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

1. **FORMATS OBLIGATOIRES** :
   - Email : format standard (xxx@yyy.zzz) avec @ et domaine valide
   - Téléphone : exactement 10 chiffres (06/07 pour mobile, 01-05/09 pour fixe)
   - Code postal : exactement 5 chiffres entre 01000 et 99999
   - Date : format ISO (YYYY-MM-DD) ou français (DD/MM/YYYY), cohérent
   - RIB : format IBAN français (FR + 25 chiffres) ou RIB classique (23 chiffres)
   - Numéro sécu : 15 chiffres (1/2 + année + mois + département + commune + ordre + clé)

2. **COHÉRENCE TEMPORELLE** :
   - Date de naissance : entre 1900 et aujourd'hui
   - Dates futures : interdites (sauf rendez-vous)
   - Ordre logique : date début < date fin

3. **MONTANTS ET VALEURS NUMÉRIQUES** :
   - Tous les montants doivent être >= 0
   - Revenus mensuels : entre 0€ et 50000€ (réaliste)
   - Loyer mensuel : entre 50€ et 10000€ (réaliste)
   - Âge : entre 0 et 120 ans

4. **RÈGLES MÉTIER FRANÇAISES (CRITICAL)** :
   
   **CAF - APL** :
   - Loyer DOIT être < Revenus × 3 (ratio d'endettement max 33%)
   - Revenus mensuels > 0 (sauf RSA)
   - Si propriétaire : APL INTERDITE (réservée locataires)
   
   **CAF - RSA** :
   - Revenus mensuels <= 607€ (plafond RSA 2025 personne seule)
   - Si revenus > 607€ : INÉLIGIBLE (severity: critical)
   - Âge >= 25 ans (sauf jeunes parents ou femmes enceintes)
   
   **IMPORTANT - Calcul logique RSA** :
   - Exemple 1 : Revenus 500€ → 500 <= 607 → **ÉLIGIBLE** 
   - Exemple 2 : Revenus 607€ → 607 <= 607 → **ÉLIGIBLE** 
   - Exemple 3 : Revenus 800€ → 800 > 607 → **INÉLIGIBLE** 
   - NE PAS inverser la logique de comparaison !
   
   **ANTS - Passeport/CNI** :
   - Photo format ANTS obligatoire (35mm × 45mm, moins de 6 mois)
   - Justificatif domicile < 6 mois obligatoire
   - Timbre fiscal : 86€ pour passeport, gratuit pour CNI
   
   **Pôle Emploi** :
   - Attestation employeur OBLIGATOIRE (certificat travail)
   - RIB OBLIGATOIRE pour versement allocations
   - Email + téléphone OBLIGATOIRES (contact)
   
   **Sécurité Sociale** :
   - Numéro sécu OBLIGATOIRE (15 chiffres valides)
   - RIB OBLIGATOIRE pour remboursements
   
   **Impôts** :
   - Numéro fiscal : 13 chiffres obligatoires
   - Revenu fiscal référence > 0 (sauf non imposable)
   
   **Préfecture - Titre séjour** :
   - Passeport valide OBLIGATOIRE
   - Justificatif ressources OBLIGATOIRE
   
   **URSSAF - Auto-entrepreneur** :
   - SIRET : 14 chiffres (9 SIREN + 5 NIC)
   - Activité déclarée OBLIGATOIRE

5. **COMPLÉTUDE** :
   - Champs "required: true" OBLIGATOIRES (severity: critical si manquant)
   - Valeurs non vides : pas "", null, undefined

**FORMAT DE RÉPONSE (JSON COMPACT sur UNE SEULE LIGNE) :**

{
  "valid": true/false,
  "errors": [
    {
      "field": "nom_du_champ",
      "message": "Description claire de l'erreur avec règle violée",
      "severity": "critical|warning"
    }
  ],
  "recommendations": [
    "Conseil pratique précis avec action à faire"
  ],
  "confidence": 0.95
}

**RÈGLES SEVERITY :**
- "critical" : Bloque soumission (format invalide, règle métier violée, champ requis manquant)
- "warning" : N'empêche pas mais attention (montant inhabituel, risque refus)

**EXEMPLES CONCRETS :**

❌ CRITICAL - Format invalide :
Email "jean.dupontgmail.com" → {"field": "email", "message": "Format email invalide : @ manquant", "severity": "critical"}

❌ CRITICAL - Règle métier violée :
Revenus 800€, Loyer 900€ pour APL → {"field": "loyer", "message": "Loyer trop élevé (900€) par rapport aux revenus (800€). Ratio maximum : 33% des revenus", "severity": "critical"}

⚠️ WARNING - Valeur inhabituelle :
Revenus 4500€ pour APL → {"field": "revenus", "message": "Revenus élevés (4500€/mois). Montant APL réduit selon barème CAF", "severity": "warning"}

✅ VALID - Tout OK :
{"valid": true, "errors": [], "recommendations": ["Données complètes et conformes"], "confidence": 1.0}

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

