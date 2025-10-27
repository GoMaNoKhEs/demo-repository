// Agent de navigation - Navigue sur les sites administratifs et soumet les démarches
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { APISimulatorAgent } from "./api-simulator";

/**
 * NavigatorAgent
 *
 * Agent responsable de :
 * 1. Naviguer sur les sites administratifs (via APISimulator)
 * 2. Soumettre les démarches avec les données utilisateur
 * 3. Logger chaque action dans Firestore (activity_logs)
 * 4. Mettre à jour le processus avec le numéro de dossier
 *
 * Pattern Singleton pour une seule instance partagée
 */
export class NavigatorAgent {
  private static instance: NavigatorAgent;
  private apiSimulator: APISimulatorAgent;
  private firestore: FirebaseFirestore.Firestore;

  /**
   * Constructeur privé (Singleton)
   */
  private constructor() {
    this.apiSimulator = new APISimulatorAgent();
    this.firestore = getFirestore();
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

      // 1. Appeler l'APISimulator pour soumettre la démarche
      const apiResponse = await this.apiSimulator.simulateAPICall(
        siteName,
        endpoint,
        userData
      );

      const duration = Date.now() - startTime;

      // 2. Logger l'activité dans Firestore (activity_logs)
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
        message: `Erreur lors de la navigation sur ${siteName}: ` +
          `${error instanceof Error ? error.message : "Erreur inconnue"}`,
      };
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
        .collection("processus")
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
}
