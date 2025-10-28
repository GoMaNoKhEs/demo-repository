// Agent de navigation - Navigue sur les sites administratifs et soumet les démarches
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { APISimulatorAgent } from "./api-simulator";
import { VertexAIService } from "../services/vertex-ai";

/**
 * NavigatorAgent (avec FormFiller intégré)
 *
 * Agent responsable de :
 * 1. Mapper les données utilisateur au format du site (FormFiller)
 * 2. Naviguer sur les sites administratifs (via APISimulator)
 * 3. Soumettre les démarches avec les données mappées
 * 4. Logger chaque action dans Firestore (activity_logs)
 * 5. Mettre à jour le processus avec le numéro de dossier
 *
 * Pattern Singleton pour une seule instance partagée
 *
 * Note: FormFillerAgent a été fusionné dans NavigatorAgent pour simplifier l'architecture
 */
export class NavigatorAgent {
  private static instance: NavigatorAgent;
  private apiSimulator: APISimulatorAgent;
  private firestore: FirebaseFirestore.Firestore;
  private vertexAI: VertexAIService;

  /**
   * Constructeur privé (Singleton)
   */
  private constructor() {
    this.apiSimulator = new APISimulatorAgent();
    this.firestore = getFirestore();
    this.vertexAI = new VertexAIService();
  }

  /**
   * Récupère l'instance unique du NavigatorAgent (Singleton)
   */
  public static getInstance(): NavigatorAgent {
    if (!NavigatorAgent.instance) {
      NavigatorAgent.instance = new NavigatorAgent();
    }
    return NavigatorAgent.instance;
  }

  /**
   * Navigue sur un site administratif et soumet une démarche
   *
   * @param processId - ID du processus Firestore
   * @param siteName - Nom du site (CAF, ANTS, IMPOTS, SECU, POLE_EMPLOI, PREFECTURE, URSSAF)
   * @param userData - Données utilisateur à soumettre
   * @param endpoint - Endpoint API à appeler (optionnel)
   * @returns Résultat de la soumission avec numéro de dossier
   */
  async navigateAndSubmit(
    processId: string,
    siteName: "CAF" | "ANTS" | "IMPOTS" | "SECU" | "POLE_EMPLOI" | "PREFECTURE" | "URSSAF",
    userData: Record<string, any>,
    endpoint = "/submit"
  ): Promise<{
    success: boolean;
    numeroDossier?: string;
    message: string;
    delaiEstime?: string;
    prochainEtape?: string;
    documentsManquants?: string[];
  }> {
    const startTime = Date.now();

    try {
      console.log(`🧭 Navigator: Début navigation sur ${siteName} pour processus ${processId}`);

      // LOG DÉTAILLÉ: Début du processus de navigation
      await this.logDetailedAction(
        processId,
        `🌐 Initialisation connexion vers ${siteName}`,
        "info",
        { siteName, endpoint }
      );

      // LOG DÉTAILLÉ: Préparation des données
      const dataKeys = Object.keys(userData);
      await this.logDetailedAction(
        processId,
        `📋 Préparation des données (${dataKeys.length} champs)`,
        "info",
        { fields: dataKeys }
      );

      // LOG DÉTAILLÉ: Connexion en cours
      await this.logDetailedAction(
        processId,
        `🔗 Connexion au portail ${siteName}...`,
        "info"
      );

      // 1. Appeler l'APISimulator pour soumettre la démarche
      const apiResponse = await this.apiSimulator.simulateAPICall(
        siteName,
        endpoint,
        userData
      );

      // LOG DÉTAILLÉ: Connexion réussie
      await this.logDetailedAction(
        processId,
        `✅ Connexion établie avec ${siteName}`,
        "success"
      );

      // LOG DÉTAILLÉ: Détails des données envoyées
      if (userData.nom && userData.prenom) {
        await this.logDetailedAction(
          processId,
          `👤 Identification: ${userData.prenom} ${userData.nom}`,
          "info"
        );
      }

      if (userData.ville) {
        await this.logDetailedAction(
          processId,
          `📍 Localisation: ${userData.ville}`,
          "info"
        );
      }

      if (userData.loyer) {
        await this.logDetailedAction(
          processId,
          `💰 Montant loyer: ${userData.loyer}€`,
          "info"
        );
      }

      if (userData.revenus) {
        await this.logDetailedAction(
          processId,
          `💵 Revenus mensuels: ${userData.revenus}€`,
          "info"
        );
      }

      // LOG DÉTAILLÉ: Soumission formulaire
      await this.logDetailedAction(
        processId,
        `📤 Soumission du formulaire en cours...`,
        "info"
      );

      const duration = Date.now() - startTime;

      // LOG DÉTAILLÉ: Résultat de la soumission
      if (apiResponse.statut === "success") {
        await this.logDetailedAction(
          processId,
          `✅ Formulaire envoyé avec succès`,
          "success",
          { duration: `${duration}ms` }
        );

        if (apiResponse.numeroDossier) {
          await this.logDetailedAction(
            processId,
            `📄 Numéro de dossier attribué: ${apiResponse.numeroDossier}`,
            "success",
            { numeroDossier: apiResponse.numeroDossier }
          );
        }

        if (apiResponse.delaiEstime) {
          await this.logDetailedAction(
            processId,
            `⏱️ Délai estimé de traitement: ${apiResponse.delaiEstime}`,
            "info"
          );
        }
      } else {
        await this.logDetailedAction(
          processId,
          `⚠️ Soumission avec avertissements`,
          "warning",
          { statut: apiResponse.statut }
        );
      }

      // 2. Logger l'activité dans Firestore (activity_logs) - Log global
      await this.logActivity(processId, siteName, apiResponse, duration);

      // 3. Mettre à jour le processus avec le numéro de dossier si success
      if (apiResponse.statut === "success" && apiResponse.numeroDossier) {
        await this.updateProcessWithReference(processId, apiResponse.numeroDossier, siteName);
      }

      console.log(`✅ Navigator: Navigation terminée sur ${siteName} - ${apiResponse.statut}`);

      // 4. Retourner le résultat formaté
      return {
        success: apiResponse.statut === "success",
        numeroDossier: apiResponse.numeroDossier,
        message: apiResponse.message,
        delaiEstime: apiResponse.delaiEstime,
        prochainEtape: apiResponse.prochainEtape,
        documentsManquants: apiResponse.documentsManquants,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(`❌ Navigator: Erreur navigation sur ${siteName}:`, error);

      // Logger l'erreur dans activity_logs
      await this.logActivity(processId, siteName, {
        statut: "error",
        message: `Erreur technique: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        numeroDossier: "",
        prochainEtape: "Réessayer ultérieurement",
        delaiEstime: "N/A",
        documentsManquants: [],
      }, duration);

      return {
        success: false,
        message: `Erreur lors de la navigation sur ${siteName}: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      };
    }
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
        agent: "NavigatorAgent",
        metadata: metadata || {},
      });
      console.log(`📝 [${type.toUpperCase()}] ${message}`);
    } catch (error) {
      console.error("❌ Erreur logging action détaillée:", error);
      // Ne pas bloquer le flux si le logging échoue
    }
  }

  /**
   * Enregistre l'activité dans Firestore (collection activity_logs)
   *
   * @param processId - ID du processus
   * @param siteName - Nom du site
   * @param apiResponse - Réponse de l'API
   * @param duration - Durée de l'appel en ms
   */
  private async logActivity(
    processId: string,
    siteName: string,
    apiResponse: any,
    duration: number
  ): Promise<void> {
    try {
      const activityLog = {
        processId,
        siteName,
        timestamp: Timestamp.now(),
        statut: apiResponse.statut,
        numeroDossier: apiResponse.numeroDossier || "",
        message: apiResponse.message,
        delaiEstime: apiResponse.delaiEstime || "N/A",
        prochainEtape: apiResponse.prochainEtape || "",
        documentsManquants: apiResponse.documentsManquants || [],
        duration, // en millisecondes
        agent: "NavigatorAgent",
      };

      const docRef = await this.firestore
        .collection("activity_logs")
        .add(activityLog);

      console.log(`📝 Activity log créé: ${docRef.id}`);
    } catch (error) {
      console.error("❌ Erreur lors du logging de l'activité:", error);
      // Ne pas bloquer le flux si le logging échoue
    }
  }

  /**
   * Met à jour le processus avec le numéro de dossier obtenu
   *
   * @param processId - ID du processus
   * @param numeroDossier - Numéro de dossier obtenu
   * @param siteName - Nom du site
   */
  private async updateProcessWithReference(
    processId: string,
    numeroDossier: string,
    siteName: string
  ): Promise<void> {
    try {
      await this.firestore
        .collection("processes")
        .doc(processId)
        .update({
          externalReference: numeroDossier,
          siteName,
          lastUpdated: Timestamp.now(),
          status: "submitted", // Statut mis à jour après soumission
        });

      console.log(`📄 Processus ${processId} mis à jour avec numéro: ${numeroDossier}`);
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du processus:", error);
      // Ne pas bloquer le flux si la mise à jour échoue
    }
  }

  /**
   * Récupère l'historique des activités d'un processus
   *
   * @param processId - ID du processus
   * @returns Liste des activités du processus
   */
  async getProcessActivities(processId: string): Promise<any[]> {
    try {
      const snapshot = await this.firestore
        .collection("activity_logs")
        .where("processId", "==", processId)
        .get();

      const activities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Trier manuellement par timestamp (évite l'index composite)
      activities.sort((a: any, b: any) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeB - timeA; // desc
      });

      console.log(`📊 ${activities.length} activités trouvées pour processus ${processId}`);

      return activities;
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des activités:", error);
      return [];
    }
  }

  /**
   * ========================================
   * FONCTIONNALITÉS FORMFILLER INTÉGRÉES
   * ========================================
   * Ces méthodes remplacent le FormFillerAgent (DEV1)
   * pour simplifier l'architecture
   */

  /**
   * Mappe les données utilisateur au format attendu par le site
   * (Anciennement FormFillerAgent.mapUserDataToForm)
   *
   * @param processId - ID du processus
   * @param userData - Données utilisateur brutes
   * @param siteName - Site cible (CAF, ANTS, etc.)
   * @returns Résultat du mapping avec données transformées
   */
  async mapUserDataToForm(
    processId: string,
    userData: Record<string, any>,
    siteName: "CAF" | "ANTS" | "IMPOTS" | "SECU" | "POLE_EMPLOI" | "PREFECTURE" | "URSSAF"
  ): Promise<FormMappingResult> {
    const startTime = Date.now();

    try {
      console.log(`🔄 Navigator: Début mapping données pour ${siteName}`);

      // LOG DÉTAILLÉ: Début du mapping
      await this.logDetailedAction(
        processId,
        `🔄 Début transformation des données pour ${siteName}`,
        "info",
        { siteName }
      );

      // LOG DÉTAILLÉ: Analyse des données entrantes
      const userDataKeys = Object.keys(userData);
      await this.logDetailedAction(
        processId,
        `📊 Analyse de ${userDataKeys.length} champs utilisateur`,
        "info",
        { fields: userDataKeys.join(", ") }
      );

      // Construire le prompt de mapping
      const prompt = this.buildMappingPrompt(userData, siteName);

      // LOG DÉTAILLÉ: Appel à l'IA pour mapping
      await this.logDetailedAction(
        processId,
        `🤖 Utilisation de l'IA pour optimiser le mapping`,
        "info"
      );

      // Appeler Vertex AI pour mapper les données
      const response = await this.vertexAI.generateResponse("FORM_FILLER", prompt);

      // Nettoyer et parser la réponse
      const cleanResponse = this.cleanJsonResponse(response);
      const mappingResult: FormMappingResult = JSON.parse(cleanResponse);

      const duration = Date.now() - startTime;

      // LOG DÉTAILLÉ: Résultat du mapping avec détails
      await this.logDetailedAction(
        processId,
        `✅ Transformation réussie (confiance: ${Math.round((mappingResult.confidence || 0) * 100)}%)`,
        "success",
        { 
          duration: `${duration}ms`,
          confidence: mappingResult.confidence,
          mappedFieldsCount: Object.keys(mappingResult.mappedData).length
        }
      );

      // LOG DÉTAILLÉ: Champs manquants si présents
      if (mappingResult.missingFields && mappingResult.missingFields.length > 0) {
        await this.logDetailedAction(
          processId,
          `⚠️ ${mappingResult.missingFields.length} champ(s) manquant(s): ${mappingResult.missingFields.join(", ")}`,
          "warning",
          { missingFields: mappingResult.missingFields }
        );
      } else {
        await this.logDetailedAction(
          processId,
          `✅ Tous les champs requis sont présents`,
          "success"
        );
      }

      // LOG DÉTAILLÉ: Warnings si présents
      if (mappingResult.warnings && mappingResult.warnings.length > 0) {
        for (const warning of mappingResult.warnings) {
          await this.logDetailedAction(
            processId,
            `⚠️ Avertissement: ${warning}`,
            "warning"
          );
        }
      }

      // LOG DÉTAILLÉ: Afficher quelques champs mappés importants
      const mappedData = mappingResult.mappedData;
      if (mappedData.nom || mappedData.NOM_ALLOCATAIRE) {
        const nom = mappedData.nom || mappedData.NOM_ALLOCATAIRE;
        await this.logDetailedAction(
          processId,
          `   ✏️ Champ "Nom": ${nom}`,
          "info"
        );
      }

      if (mappedData.prenom || mappedData.PRENOM_ALLOCATAIRE) {
        const prenom = mappedData.prenom || mappedData.PRENOM_ALLOCATAIRE;
        await this.logDetailedAction(
          processId,
          `   ✏️ Champ "Prénom": ${prenom}`,
          "info"
        );
      }

      if (mappedData.ville || mappedData.VILLE) {
        const ville = mappedData.ville || mappedData.VILLE;
        await this.logDetailedAction(
          processId,
          `   ✏️ Champ "Ville": ${ville}`,
          "info"
        );
      }

      if (mappedData.loyer || mappedData.MONTANT_LOYER) {
        const loyer = mappedData.loyer || mappedData.MONTANT_LOYER;
        await this.logDetailedAction(
          processId,
          `   ✏️ Champ "Loyer": ${loyer}€`,
          "info"
        );
      }

      // Logger le mapping dans Firestore (log global)
      await this.logMappingActivity(processId, siteName, mappingResult, duration);

      console.log(`✅ Navigator: Mapping terminé pour ${siteName} (${duration}ms)`);

      return mappingResult;
    } catch (error) {
      console.error(`❌ Navigator: Erreur mapping pour ${siteName}:`, error);

      // LOG DÉTAILLÉ: Erreur lors du mapping
      await this.logDetailedAction(
        processId,
        `❌ Erreur lors du mapping: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        "error",
        { error: String(error) }
      );

      // Retourner mapping par défaut (userData tel quel)
      return {
        mappedData: userData,
        missingFields: [],
        warnings: [`Erreur mapping: ${error}. Données utilisées telles quelles.`],
        confidence: 0.5,
      };
    }
  }

  /**
   * Construit le prompt de mapping pour Vertex AI
   */
  private buildMappingPrompt(userData: any, siteName: string): string {
    const formStructures: Record<string, string> = {
      CAF: `
Champs CAF:
- NOM_ALLOCATAIRE (string, uppercase)
- PRENOM_ALLOCATAIRE (string, capitalize)
- SITUATION_FAMILIALE (code: 1=Célibataire, 2=Marié, 3=Pacsé, 4=Divorcé, 5=Veuf)
- NOMBRE_ENFANTS (number)
- REVENUS_MENSUELS (string format "XXXX.XX")
- DATE_NAISSANCE (ISO format YYYY-MM-DD)
- VILLE (string)
- CODE_POSTAL (string 5 chiffres)
- TYPE_LOGEMENT (code: LOC=Locataire, PROP=Propriétaire, HLM=HLM)
- MONTANT_LOYER (string format "XXX.XX")
- EMAIL (string lowercase)
- TELEPHONE (string 10 chiffres sans espaces)`,
      ANTS: `
Champs ANTS:
- NOM (string, uppercase)
- PRENOM (string, capitalize)
- DATE_NAISSANCE (format DD/MM/YYYY)
- LIEU_NAISSANCE (string)
- NATIONALITE (string uppercase)
- ADRESSE (string complète)
- CODE_POSTAL (string 5 chiffres)
- VILLE (string uppercase)`,
      IMPOTS: `
Champs IMPOTS:
- NOM_FISCAL (string uppercase)
- PRENOM (string capitalize)
- NUMERO_FISCAL (13 chiffres)
- REVENUS_ANNUELS (number entier)
- SITUATION (code: C=Célibataire, M=Marié, D=Divorcé, V=Veuf)`,
      SECU: `
Champs SECU:
- NOM (string uppercase)
- PRENOM (string capitalize)
- NUMERO_SECU (15 chiffres)
- DATE_NAISSANCE (format DD/MM/YYYY)`,
      POLE_EMPLOI: `
Champs POLE_EMPLOI:
- NOM (string uppercase)
- PRENOM (string capitalize)
- IDENTIFIANT_PE (8 chiffres + 1 lettre)
- DATE_FIN_CONTRAT (format DD/MM/YYYY)`,
      PREFECTURE: `
Champs PREFECTURE:
- NOM (string uppercase)
- PRENOM (string capitalize)
- DATE_NAISSANCE (format DD/MM/YYYY)
- ADRESSE_COMPLETE (string)
- MOTIF_DEMANDE (string)`,
      URSSAF: `
Champs URSSAF:
- NOM_ENTREPRISE (string uppercase)
- SIRET (14 chiffres)
- ACTIVITE (code APE)
- CA_ANNUEL (number)`,
    };

    return `Tu es un expert en mapping de données pour les formulaires administratifs français.

**DONNÉES UTILISATEUR (format libre) :**
${JSON.stringify(userData, null, 2)}

**FORMULAIRE CIBLE : ${siteName}**
${formStructures[siteName] || "Structure non définie"}

**INSTRUCTIONS :**
1. Transforme les données utilisateur au format exact attendu par ${siteName}
2. Applique les transformations de format (uppercase, dates, codes, etc.)
3. Détecte les champs manquants requis
4. Génère des warnings si données incohérentes

**FORMAT DE RÉPONSE (JSON COMPACT sur UNE SEULE LIGNE) :**

{
  "mappedData": {
    "CHAMP_1": "valeur transformée",
    "CHAMP_2": "valeur transformée"
  },
  "missingFields": ["champ1", "champ2"],
  "warnings": ["Warning 1", "Warning 2"],
  "confidence": 0.95
}

**RÈGLES DE TRANSFORMATION :**
- Noms/Prénoms : Appliquer uppercase/capitalize selon spécification
- Dates : Convertir au format demandé (ISO vs DD/MM/YYYY)
- Codes : Mapper texte → code (ex: "Célibataire" → "1" pour CAF)
- Montants : Formater avec décimales si requis
- Téléphone : Supprimer espaces, garder 10 chiffres

Retourne UNIQUEMENT le JSON (pas de texte avant/après).`;
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
   * Log le mapping dans Firestore
   */
  private async logMappingActivity(
    processId: string,
    siteName: string,
    mappingResult: FormMappingResult,
    duration: number
  ): Promise<void> {
    try {
      await this.firestore.collection("activity_logs").add({
        processId,
        siteName,
        timestamp: Timestamp.now(),
        agent: "NavigatorAgent (FormMapper)",
        statut: "success",
        message: `✅ Mapping données pour ${siteName} réussi`,
        details: {
          missingFields: mappingResult.missingFields,
          warnings: mappingResult.warnings,
          confidence: mappingResult.confidence,
        },
        duration,
      });
    } catch (error) {
      console.error("❌ Erreur logging mapping:", error);
    }
  }

  /**
   * Retourne la structure de formulaire complète pour chaque site
   * Permet de connaître tous les champs possibles et requis
   */
  getFormStructureForSite(
    siteName: "CAF" | "ANTS" | "IMPOTS" | "SECU" | "POLE_EMPLOI" | "PREFECTURE" | "URSSAF",
    formType?: string
  ): FormStructure {
    const structures: Record<string, FormStructure> = {
      // ========== CAF ==========
      CAF_APL: {
        fields: [
          { name: "nom", type: "string", required: true },
          { name: "prenom", type: "string", required: true },
          { name: "dateNaissance", type: "date", required: true },
          { name: "numeroAllocataire", type: "string", required: false },
          { name: "adresse", type: "string", required: true },
          { name: "codePostal", type: "string", required: true, pattern: "^[0-9]{5}$" },
          { name: "ville", type: "string", required: true },
          { name: "loyer", type: "number", required: true },
          { name: "revenus", type: "number", required: true },
          { name: "rib", type: "string", required: true, pattern: "^FR[0-9]{25}$" },
          { name: "bailLocation", type: "file", required: true },
          { name: "avisImposition", type: "file", required: true },
        ],
        siteUrl: "https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/logement/apl",
      },
      CAF_RSA: {
        fields: [
          { name: "nom", type: "string", required: true },
          { name: "prenom", type: "string", required: true },
          { name: "dateNaissance", type: "date", required: true },
          { name: "numeroAllocataire", type: "string", required: false },
          { name: "adresse", type: "string", required: true },
          { name: "revenus", type: "number", required: true },
          { name: "situation", type: "select", required: true, options: ["celibataire", "marie", "pacse", "divorce"] },
          { name: "nombreEnfants", type: "number", required: false },
          { name: "rib", type: "string", required: true },
          { name: "attestationPoleEmploi", type: "file", required: false },
        ],
        siteUrl: "https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/solidarite-et-insertion/rsa",
      },
      // ========== ANTS ==========
      ANTS_PASSEPORT: {
        fields: [
          { name: "nom", type: "string", required: true },
          { name: "prenom", type: "string", required: true },
          { name: "dateNaissance", type: "date", required: true },
          { name: "lieuNaissance", type: "string", required: true },
          { name: "nationalite", type: "string", required: true },
          { name: "adresse", type: "string", required: true },
          { name: "codePostal", type: "string", required: true, pattern: "^[0-9]{5}$" },
          { name: "ville", type: "string", required: true },
          { name: "photoIdentite", type: "file", required: true, format: "ANTS" },
          { name: "justificatifDomicile", type: "file", required: true },
          { name: "ancienPasseport", type: "file", required: false },
          { name: "timbreFiscal", type: "number", required: true, value: 86 },
        ],
        siteUrl: "https://passeport.ants.gouv.fr",
      },
      ANTS_CNI: {
        fields: [
          { name: "nom", type: "string", required: true },
          { name: "prenom", type: "string", required: true },
          { name: "dateNaissance", type: "date", required: true },
          { name: "lieuNaissance", type: "string", required: true },
          { name: "adresse", type: "string", required: true },
          { name: "photoIdentite", type: "file", required: true, format: "ANTS" },
          { name: "justificatifDomicile", type: "file", required: true },
          { name: "actNaissance", type: "file", required: true },
        ],
        siteUrl: "https://carte-identite.ants.gouv.fr",
      },
      // ========== PÔLE EMPLOI ==========
      POLE_EMPLOI_INSCRIPTION: {
        fields: [
          { name: "nom", type: "string", required: true },
          { name: "prenom", type: "string", required: true },
          { name: "dateNaissance", type: "date", required: true },
          { name: "numeroSecu", type: "string", required: true, pattern: "^[12][0-9]{14}$" },
          { name: "adresse", type: "string", required: true },
          { name: "telephone", type: "string", required: true, pattern: "^0[0-9]{9}$" },
          { name: "email", type: "email", required: true },
          { name: "rib", type: "string", required: true },
          { name: "attestationEmployeur", type: "file", required: true },
          { name: "pieceIdentite", type: "file", required: true },
          { name: "cv", type: "file", required: false },
        ],
        siteUrl: "https://www.pole-emploi.fr/candidat/inscription",
      },
      // ========== SÉCURITÉ SOCIALE ==========
      SECU_CARTE_VITALE: {
        fields: [
          { name: "nom", type: "string", required: true },
          { name: "prenom", type: "string", required: true },
          { name: "numeroSecu", type: "string", required: true, pattern: "^[12][0-9]{14}$" },
          { name: "dateNaissance", type: "date", required: true },
          { name: "adresse", type: "string", required: true },
          { name: "photoIdentite", type: "file", required: true },
          { name: "rib", type: "string", required: true },
        ],
        siteUrl: "https://www.ameli.fr",
      },
      // ========== IMPÔTS ==========
      IMPOTS_DECLARATION: {
        fields: [
          { name: "nom", type: "string", required: true },
          { name: "prenom", type: "string", required: true },
          { name: "numeroFiscal", type: "string", required: true, pattern: "^[0-9]{13}$" },
          { name: "revenuFiscalReference", type: "number", required: true },
          { name: "situationFamiliale", type: "select", required: true },
          { name: "nombreParts", type: "number", required: true },
          { name: "adresse", type: "string", required: true },
        ],
        siteUrl: "https://www.impots.gouv.fr",
      },
      // ========== PRÉFECTURE ==========
      PREFECTURE_TITRE_SEJOUR: {
        fields: [
          { name: "nom", type: "string", required: true },
          { name: "prenom", type: "string", required: true },
          { name: "dateNaissance", type: "date", required: true },
          { name: "nationalite", type: "string", required: true },
          { name: "passeport", type: "file", required: true },
          { name: "justificatifDomicile", type: "file", required: true },
          { name: "justificatifRessources", type: "file", required: true },
          { name: "photoIdentite", type: "file", required: true },
        ],
        siteUrl: "https://administration-etrangers-en-france.interieur.gouv.fr",
      },
      // ========== URSSAF ==========
      URSSAF_AUTO_ENTREPRENEUR: {
        fields: [
          { name: "nom", type: "string", required: true },
          { name: "prenom", type: "string", required: true },
          { name: "dateNaissance", type: "date", required: true },
          { name: "numeroSecu", type: "string", required: true },
          { name: "adresse", type: "string", required: true },
          { name: "activite", type: "string", required: true },
          { name: "rib", type: "string", required: true },
          { name: "pieceIdentite", type: "file", required: true },
        ],
        siteUrl: "https://www.autoentrepreneur.urssaf.fr",
      },
    };

    // Déterminer la clé basée sur siteName + formType
    const key = formType ? `${siteName}_${formType.toUpperCase()}` : `${siteName}_DEFAULT`;
    
    return structures[key] || structures[`${siteName}_APL`] || {
      fields: [],
      siteUrl: `https://www.${siteName.toLowerCase()}.fr`,
    };
  }
}

/**
 * Interface du résultat de mapping (anciennement FormFillerAgent)
 */
export interface FormMappingResult {
  mappedData: Record<string, any>;
  missingFields: string[];
  warnings: string[];
  confidence: number;
}

/**
 * Interface de structure de formulaire
 */
export interface FormStructure {
  fields: FormField[];
  siteUrl: string;
}

/**
 * Interface d'un champ de formulaire
 */
export interface FormField {
  name: string;
  type: "string" | "number" | "date" | "email" | "select" | "file";
  required: boolean;
  pattern?: string;
  options?: string[];
  format?: string;
  value?: any;
}
