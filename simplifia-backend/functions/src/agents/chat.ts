// Agent de chat - Gère les conversations avec l'utilisateur

import * as admin from "firebase-admin";
import { VertexAIService } from "../services/vertex-ai";

/**
 * Agent de chat conversationnel avec IA (Pattern Singleton)
 */
export class ChatAgent {
  private static instance: ChatAgent;
  private vertexAI: VertexAIService;
  private db = admin.firestore();

  /**
   * Constructeur privé pour empêcher l'instanciation directe
   */
  private constructor() {
    this.vertexAI = new VertexAIService();
  }

  /**
   * Retourne les champs obligatoires selon le type de démarche
   */
  private getRequiredFieldsForDemarche(demarche: string): string[] {
    // 🔥 FIX: Vérifier que demarche n'est pas null/undefined
    if (!demarche || typeof demarche !== 'string') {
      console.warn('[ChatAgent] demarche is null or invalid, returning basic fields');
      return ["nom", "prenom", "email", "telephone"];
    }
    
    const demarcheLower = demarche.toLowerCase();
    
    // APL / Aide au logement
    if (demarcheLower.includes("apl") || demarcheLower.includes("aide au logement") || demarcheLower.includes("caf")) {
      return [
        "nom", "prenom", "email", "telephone", "dateNaissance",
        "adresseComplete", "ville", "codePostal",
        "situation", "logement", "loyer", "charges", "revenus",
        "nomBailleur", "dateEntree", "surfaceLogement"
      ];
    }
    
    // Déclaration de naissance (13 champs)
    if (demarcheLower.includes("naissance") || demarcheLower.includes("déclaration")) {
      return [
        "nom", "prenom", "email", "telephone", "dateNaissance",
        "adresseComplete", "ville", "codePostal", "lieuNaissance",
        "nomEnfant", "prenomEnfant", "dateNaissanceEnfant", "lieuNaissanceEnfant"
      ];
    }
    
    // Carte d'identité / Passeport (14 champs)
    if (demarcheLower.includes("carte d'identité") || demarcheLower.includes("passeport") || demarcheLower.includes("cni")) {
      return [
        "nom", "prenom", "email", "telephone", "dateNaissance", "lieuNaissance",
        "adresseComplete", "ville", "codePostal",
        "numeroSecu", "taille", "couleurYeux", "photo", "timbreFiscal"
      ];
    }
    
    // RSA / Aide sociale (14 champs)
    if (demarcheLower.includes("rsa") || demarcheLower.includes("revenu") || demarcheLower.includes("aide sociale")) {
      return [
        "nom", "prenom", "email", "telephone", "dateNaissance",
        "adresseComplete", "ville", "codePostal",
        "situation", "revenus", "charges", "numeroSecu",
        "numeroAllocataire", "rib"
      ];
    }
    
    // Par défaut : infos de base
    return ["nom", "prenom", "email", "telephone", "ville"];
  }

  /**
   * Valide programmatiquement que TOUS les champs requis sont collectés
   * Retourne {valid: boolean, missingFields: string[]}
   */
  private validateRequiredFields(demarche: string, collectedInfo: any): {valid: boolean, missingFields: string[]} {
    // 🔥 FIX: Vérifier que demarche n'est pas null
    if (!demarche || typeof demarche !== 'string') {
      console.warn('[ChatAgent] validateRequiredFields: demarche is null');
      return { valid: false, missingFields: ["démarche non identifiée"] };
    }
    
    const requiredFields = this.getRequiredFieldsForDemarche(demarche);
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const value = collectedInfo[field];
      if (!value || value === null || value === "" || value === "null") {
        missingFields.push(field);
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Obtenir l'instance unique de ChatAgent (Singleton Pattern)
   */
  public static getInstance(): ChatAgent {
    if (!ChatAgent.instance) {
      ChatAgent.instance = new ChatAgent();
    }
    return ChatAgent.instance;
  }

  /**
   * Nettoie la réponse JSON de Vertex AI
   * Utilisée pour parser les réponses IA qui peuvent contenir du markdown
   */
  private cleanJsonResponse(response: string): string {
    // Supprimer les markdown code blocks
    let cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    // Supprimer les retours à la ligne et espaces multiples dans le JSON
    cleaned = cleaned.replace(/\n/g, " ").replace(/\r/g, "");
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
  }

  /**
   * Traiter un message utilisateur et répondre
   */
  async processUserMessage(
    sessionId: string,
    userMessage: string,
    userId?: string  // ✅ OPTIONNEL pour rétrocompatibilité
  ): Promise<void> {
    try {
      console.log(`Processing message for session ${sessionId}`);
      console.log(`userId from trigger: ${userId}`);

      // Récupérer l'historique de conversation
      const conversationHistory = await this.getConversationHistory(sessionId);

      // Analyser le contexte et détecter changement de sujet
      const contextAnalysis = await this.analyzeContext(conversationHistory, userMessage);

      // Analyser l'intention et la disponibilité à créer un processus
      const intentAnalysis = await this.analyzeIntentAndReadiness(conversationHistory, userMessage);

      // ⚠️ VALIDATION PROGRAMMATIQUE : Override readyToStart si champs manquants
      const fieldsValidation = this.validateRequiredFields(intentAnalysis.demarche, intentAnalysis.collectedInfo);
      if (!fieldsValidation.valid) {
        console.log(`❌ [ChatAgent] readyToStart forcé à FALSE - Champs manquants: ${fieldsValidation.missingFields.join(", ")}`);
        intentAnalysis.readyToStart = false;
        intentAnalysis.missingInfo = fieldsValidation.missingFields;
      } else {
        console.log(`✅ [ChatAgent] Tous les champs requis sont collectés (${this.getRequiredFieldsForDemarche(intentAnalysis.demarche).length} champs)`);
      }

      // Logs détaillés pour debug
      console.log(`[ChatAgent] Intent Analysis for session ${sessionId}:`);
      console.log(`  - demarche: ${intentAnalysis.demarche}`);
      console.log(`  - readyToStart: ${intentAnalysis.readyToStart}`);
      console.log(`  - userConfirmed: ${intentAnalysis.userConfirmed}`);
      console.log(`  - confidence: ${intentAnalysis.confidence}`);
      console.log(`  - missingInfo: ${JSON.stringify(intentAnalysis.missingInfo)}`);
      console.log(`  - collectedInfo: ${JSON.stringify(intentAnalysis.collectedInfo)}`);

      // Si l'utilisateur est prêt et confirme (détecté par l'IA), créer le processus
      if (intentAnalysis.readyToStart && intentAnalysis.userConfirmed && intentAnalysis.confidence > 0.7) {
        console.log(`[ChatAgent] Creating process for session ${sessionId}`);
        await this.createProcessFromConversation(sessionId, intentAnalysis, userId);  // ✅ PASSER userId
        return; // Fin de la conversation
      }

      // Si prêt mais pas encore confirmé → demander confirmation explicite
      if (intentAnalysis.readyToStart && !intentAnalysis.userConfirmed && intentAnalysis.confidence > 0.7) {
        console.log("[ChatAgent] Ready but not confirmed - asking for confirmation");
        const collectedInfoSummary = Object.entries(intentAnalysis.collectedInfo || {})
          .filter(([_, value]) => value !== null && value !== "")
          .map(([key, value]) => `✓ ${this.formatFieldName(key)}: ${value}`)
          .join("\n");

        const confirmationPrompt = `✅ Parfait ! J'ai toutes les informations nécessaires pour votre ${intentAnalysis.demarche}.

📋 **Récapitulatif :**
${collectedInfoSummary}

🚀 **SimplifIA va maintenant s'occuper de tout :**
- Connexion automatique au site ${this.getOrganismForDemarche(intentAnalysis.demarche)}
- Remplissage automatique du formulaire
- Soumission de votre dossier
- Suivi en temps réel de l'avancement

⏱️ **Temps estimé :** 2-3 minutes (au lieu de 45 minutes manuellement)

**Souhaitez-vous que je crée votre dossier maintenant ?**
(Répondez "oui" pour démarrer le processus automatique)`;

        await this.addAgentResponse(sessionId, confirmationPrompt);
        return;
      }

      // Compter les messages réels depuis Firestore (limite à 4 échanges = 8 messages)
      const messagesSnapshot = await this.db
        .collection("messages")
        .where("sessionId", "==", sessionId)
        .get();

      // +1 pour inclure le message utilisateur actuel (pas encore sauvegardé dans messages)
      // +1 pour le message agent qu'on va créer
      const messageCount = messagesSnapshot.size + 2;

      // Forcer proposition après 8 messages
      if (messageCount >= 8 && !intentAnalysis.readyToStart) {
        // Construire message avec infos manquantes lisibles
        const missingInfoText = intentAnalysis.missingInfo && intentAnalysis.missingInfo.length > 0 ?
          intentAnalysis.missingInfo.map((info: string) => `- ${info}`).join("\n") :
          "quelques informations complémentaires";

        const collectedInfoText = Object.entries(intentAnalysis.collectedInfo || {})
          .filter(([_, value]) => value !== null && value !== "")
          .map(([key, value]) => `✓ ${key}: ${value}`)
          .join("\n");

        const response = `✅ D'accord, je vais vous aider avec votre ${intentAnalysis.demarche || "demande"} !

${collectedInfoText ? `Informations collectées :\n${collectedInfoText}\n\n` : ""}J'ai encore besoin de :
${missingInfoText}

Pouvez-vous me donner ces informations ?

Ou si vous avez déjà toutes les infos, répondez "oui" pour que je crée votre dossier maintenant.`;

        await this.addAgentResponse(sessionId, response);
        return;
      }

      // Conversation normale avec contexte
      const systemPrompt = this.buildSystemPrompt();
      const response = await this.generateChatResponse(
        systemPrompt,
        userMessage,
        conversationHistory,
        contextAnalysis,
        intentAnalysis
      );

      // Ajouter la réponse de l'agent au chat
      await this.addAgentResponse(sessionId, response);

      console.log(`Message processed for session ${sessionId}`);
    } catch (error) {
      console.error(`CHAT: Error processing message for session ${sessionId}: ${error}`);

      // L'agent ne gère pas les messages système d'erreur
      // C'est la responsabilité du niveau supérieur (index.ts)
      throw error;
    }
  }

  /**
   * Construire le system prompt pour le chat
   */
  private buildSystemPrompt(): string {
    return `Tu es SimplifIA, l'expert des démarches administratives françaises. 
Tu es précis, méthodique et tu collectes TOUTES les informations nécessaires EN UNE SEULE FOIS.

RÈGLES ABSOLUES :
1. ✅ DEMANDER TOUTES LES INFOS NÉCESSAIRES EN UNE SEULE FOIS (pas une par une)
2. ❌ NE JAMAIS demander les infos progressivement (1 ou 2 à la fois)
3. 📋 LISTER clairement TOUTES les infos requises dès la première interaction
4. ✅ Si l'utilisateur ne donne pas tout → RE-LISTER seulement ce qui manque
5. 🎯 IDENTIFIER précisément l'aide/démarche demandée
6. 📄 LISTER les documents exacts nécessaires
7. 📝 EXPLIQUER les étapes concrètes à suivre

STRATÉGIE DE COLLECTE D'INFORMATIONS :

**PREMIÈRE RÉPONSE - Collecte complète :**
"Parfait ! Pour votre [démarche], j'ai besoin de TOUTES ces informations en une seule fois :

📋 **Informations personnelles :**
- Nom et prénom complets
- Date de naissance (format JJ/MM/AAAA)
- Email et téléphone

📍 **Adresse :**
- Adresse complète (rue, numéro)
- Code postal et ville

💼 **Situation :**
- Votre situation actuelle (étudiant/salarié/demandeur d'emploi/retraité)
- [Autres infos spécifiques selon démarche]

💰 **Informations financières :** (si applicable)
- Loyer mensuel (en euros)
- Charges mensuelles
- Revenus mensuels nets

🏠 **Logement :** (si applicable)
- Statut (locataire/propriétaire/colocataire)
- Nom du bailleur/propriétaire
- Date d'entrée dans le logement (MM/AAAA)
- Surface en m²

Vous pouvez me donner toutes ces infos d'un coup, dans l'ordre que vous voulez !"

**SI INFOS INCOMPLÈTES - Redemander seulement ce qui manque :**
"Merci pour ces informations ! ✅

J'ai bien noté :
[LISTER LES INFOS REÇUES]

Il me manque encore :
❌ [Info manquante 1]
❌ [Info manquante 2]
❌ [Info manquante 3]

Pouvez-vous me donner ces informations manquantes ?"

EXEMPLES PRÉCIS :

Pour "Demande APL/Aide au logement" :
"Parfait ! Pour votre demande d'APL, j'ai besoin de TOUTES ces informations :

📋 **Identité :** Nom, prénom, date de naissance (JJ/MM/AAAA), email, téléphone
📍 **Adresse :** Adresse complète du logement, code postal, ville
💼 **Situation :** Êtes-vous étudiant, salarié, demandeur d'emploi, retraité ?
🏠 **Logement :** Locataire ou colocataire ? Nom du propriétaire/bailleur ? Date d'entrée (MM/AAAA) ? Surface en m² ?
💰 **Finances :** Loyer mensuel ? Charges mensuelles ? Revenus mensuels nets ?

Donnez-moi toutes ces infos d'un coup, je m'occupe du reste !"

Pour "Déclaration de naissance" :
"Pour déclarer une naissance, j'ai besoin de :

📋 **Vos informations :** Nom, prénom, date de naissance, email, téléphone, adresse complète, ville, code postal
👶 **Informations de l'enfant :** Nom, prénom, date de naissance, lieu de naissance, hôpital/maternité
📍 **Mairie compétente :** Dans quelle ville/mairie souhaitez-vous faire la déclaration ?

Donnez-moi toutes ces informations maintenant !"

Pour "Passeport/Carte d'identité" :
"Pour votre demande de passeport/CNI, j'ai besoin de :

📋 **Identité :** Nom, prénom, date et lieu de naissance, email, téléphone
📍 **Adresse :** Adresse complète, code postal, ville
👤 **Informations physiques :** Taille (en cm), couleur des yeux
🆔 **Anciens documents :** Numéro de sécurité sociale, ancienne CNI/passeport si renouvellement
📸 **Documents :** Photo d'identité conforme ? Timbre fiscal acheté ?

Donnez-moi tous ces éléments maintenant !"

IMPORTANT :
- ✅ TOUJOURS demander TOUTES les infos en UNE SEULE FOIS
- ❌ JAMAIS demander progressivement (2-3 infos à la fois)
- 📋 Présenter les infos de manière organisée et claire
- ✅ Si incomplet → RE-LISTER seulement ce qui manque`;
  }

  /**
   * Récupérer l'historique de conversation (10 derniers messages)
   */
  private async getConversationHistory(sessionId: string, limit = 10): Promise<string> {
    const messages = await this.db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    if (messages.empty) {
      return "";
    }

    return messages.docs
      .reverse()
      .map((doc) => {
        const data = doc.data();
        return `${data.role}: ${data.content}`;
      })
      .join("\n");
  }

  /**
   * Analyser le contexte pour détecter changement de sujet ou continuité
   */
  private async analyzeContext(
    conversationHistory: string,
    currentMessage: string
  ): Promise<any> {
    if (!conversationHistory) {
      return {
        contextType: "new_conversation",
        previousTopic: null,
        currentTopic: null,
        isTopicChange: false,
        shouldResetContext: false,
      };
    }

    try {
      const prompt = `Analyse ce contexte conversationnel :

HISTORIQUE:
${conversationHistory}

NOUVEAU MESSAGE:
${currentMessage}

Détermine :
1. Le sujet précédent (ex: "Demande APL", "Renouvellement passeport", null)
2. Le sujet actuel du message
3. Si c'est un changement de sujet complet
4. Si c'est une continuité du sujet précédent
5. Si c'est un retour à un sujet abandonné

Retourne UNIQUEMENT ce JSON (pas de markdown):
{
  "contextType": "continuation|topic_change|topic_return|new_conversation",
  "previousTopic": "description du sujet précédent ou null",
  "currentTopic": "description du sujet actuel",
  "isTopicChange": true/false,
  "shouldResetContext": true/false,
  "relevantHistory": "résumé des infos importantes à garder"
}`;

      const response = await this.vertexAI.generateResponse("CHAT", prompt, {
        temperature: 0.3,
      });

      // Nettoyer la réponse (enlever les markdown si présents)
      const cleanedResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Error analyzing context:", error);
      // Fallback: considérer comme continuation
      return {
        contextType: "continuation",
        previousTopic: null,
        currentTopic: null,
        isTopicChange: false,
        shouldResetContext: false,
        relevantHistory: conversationHistory,
      };
    }
  }

  /**
   * Construire le contexte d'analyse d'intention pour le prompt IA
   */
  private buildIntentAnalysisContext(intentAnalysis: any): string {
    if (!intentAnalysis) return "";

    const parts: string[] = [];

    // Démarche identifiée
    if (intentAnalysis.demarche && intentAnalysis.demarche !== "Inconnu") {
      parts.push(`🎯 DÉMARCHE IDENTIFIÉE: ${intentAnalysis.demarche}`);
    }

    // Informations déjà collectées
    const collectedInfo = Object.entries(intentAnalysis.collectedInfo || {})
      .filter(([_, value]) => value !== null && value !== "" && value !== "null")
      .map(([key, value]) => `  ✅ ${this.formatFieldName(key)}: ${value}`);

    if (collectedInfo.length > 0) {
      parts.push(`\n📋 INFORMATIONS DÉJÀ COLLECTÉES:\n${collectedInfo.join("\n")}`);
    }

    // Informations manquantes
    if (intentAnalysis.missingInfo && intentAnalysis.missingInfo.length > 0) {
      const requiredFields = this.getRequiredFieldsForDemarche(intentAnalysis.demarche);
      const missingFormatted = intentAnalysis.missingInfo
        .filter((field: string) => requiredFields.includes(field))
        .map((field: string) => `  ❌ ${this.formatFieldName(field)}`);

      if (missingFormatted.length > 0) {
        parts.push(`\n❗ INFORMATIONS MANQUANTES OBLIGATOIRES:\n${missingFormatted.join("\n")}`);
        parts.push(`\n⚠️ Tu DOIS demander TOUTES ces informations manquantes EN UNE SEULE FOIS (pas progressivement)`);
      }
    }

    // État de préparation
    if (intentAnalysis.readyToStart) {
      parts.push(`\n✅ TOUTES LES INFOS SONT COLLECTÉES - Demander confirmation pour créer le dossier`);
    }

    return parts.length > 0 ? `\n${parts.join("\n")}\n` : "";
  }

  /**
   * Générer une réponse de chat avec contexte intelligent
   */
  private async generateChatResponse(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: string,
    contextAnalysis: any,
    intentAnalysis?: any
  ): Promise<string> {
    try {
      let contextInstruction = "";

      // Adapter la réponse selon le type de contexte
      switch (contextAnalysis.contextType) {
      case "topic_change":
        contextInstruction = `⚠️ L'utilisateur CHANGE DE SUJET.
Ancien sujet: ${contextAnalysis.previousTopic}
Nouveau sujet: ${contextAnalysis.currentTopic}

➡️ Tu dois:
1. Accuser réception du changement (ex: "D'accord, parlons de ${contextAnalysis.currentTopic}")
2. Repartir de zéro sur ce nouveau sujet
3. Ne pas mélanger avec le contexte précédent`;
        break;

      case "topic_return":
        contextInstruction = `L'utilisateur REVIENT à un sujet antérieur.
Sujet retrouvé: ${contextAnalysis.currentTopic}

 Tu dois:
1. Reconnaître le retour (ex: "Ah oui, revenons à votre ${contextAnalysis.currentTopic}")
2. Reprendre les infos déjà collectées: ${contextAnalysis.relevantHistory}
3. Continuer depuis où vous étiez`;
        break;

      case "continuation":
        contextInstruction = `L'utilisateur CONTINUE le sujet en cours.
Sujet: ${contextAnalysis.currentTopic}

 Tu dois:
1. Prendre en compte TOUT l'historique
2. Ne PAS redemander des infos déjà données
3. Progresser logiquement dans la conversation`;
        break;

      case "new_conversation":
        contextInstruction = `NOUVELLE CONVERSATION (pas d'historique)

 Tu dois:
1. Accueillir l'utilisateur
2. Identifier sa demande
3. Commencer à poser les bonnes questions`;
        break;
      }

      const prompt = `${contextInstruction}

${conversationHistory ? `HISTORIQUE DE LA CONVERSATION:\n${conversationHistory}\n` : ""}

NOUVEAU MESSAGE UTILISATEUR:
${userMessage}

${intentAnalysis ? this.buildIntentAnalysisContext(intentAnalysis) : ""}

INSTRUCTIONS:
- Répondre de manière précise et méthodique
- Adapter ta réponse au contexte détecté ci-dessus
- ✅ DEMANDER TOUTES LES INFOS NÉCESSAIRES EN UNE SEULE FOIS (pas progressivement)
- ❌ Si des infos sont manquantes, LISTER TOUTES celles qui manquent (pas 2-3 seulement)
- ✅ Si l'utilisateur donne des infos partielles, remercier + redemander SEULEMENT ce qui manque
- Fournir des étapes concrètes et des informations pratiques

Réponse:`;

      const response = await this.vertexAI.generateResponse("CHAT", prompt, {
        systemInstruction: systemPrompt,
      });

      return response.trim() || "Je suis désolé, je n'ai pas pu générer une réponse appropriée.";
    } catch (error) {
      console.error("Error generating chat response:", error);
      return "Je suis désolé, j'ai rencontré une erreur. Pouvez-vous reformuler votre question ?";
    }
  }

  /**
   * Analyser l'intention et la disponibilité à créer un processus
   */
  private async analyzeIntentAndReadiness(
    conversationHistory: string,
    currentMessage: string
  ): Promise<any> {
    try {
      const prompt = `Analyse cette conversation pour déterminer si l'utilisateur
est prêt à démarrer un processus administratif.

HISTORIQUE:
${conversationHistory}

NOUVEAU MESSAGE:
${currentMessage}

Analyse et retourne UNIQUEMENT ce JSON (pas de markdown):
{
  "demarche": "nom précis de la démarche (ex: Demande APL, Renouvellement passeport, Déclaration naissance)",
  "readyToStart": true/false,
  "userConfirmed": true/false,
  "confidence": 0.0-1.0,
  "missingInfo": ["info manquante 1", "info 2"],
  "collectedInfo": {
    "nom": "nom de famille ou null",
    "prenom": "prénom ou null",
    "email": "adresse email ou null",
    "telephone": "numéro de téléphone ou null",
    "dateNaissance": "date de naissance (format JJ/MM/AAAA) ou null",
    "numeroSecu": "numéro de sécurité sociale (15 chiffres) ou null",
    "adresseComplete": "adresse complète (rue, code postal, ville) ou null",
    "ville": "nom ville ou null",
    "codePostal": "code postal ou null",
    
    "situation": "étudiant/salarié/demandeur d'emploi/retraité ou null (pour APL/RSA)",
    "logement": "locataire/propriétaire/colocataire/sous-locataire ou null (pour APL)",
    "loyer": "montant du loyer mensuel (nombre) ou null (pour APL)",
    "charges": "montant des charges (nombre) ou null (pour APL)",
    "revenus": "revenus mensuels nets (nombre) ou null (pour APL/RSA)",
    "nomBailleur": "nom du propriétaire/bailleur ou null (pour APL)",
    "dateEntree": "date d'entrée dans le logement (format MM/AAAA) ou null (pour APL)",
    "surfaceLogement": "surface en m² (nombre) ou null (pour APL)",
    "numeroAllocataire": "numéro allocataire CAF (7 chiffres) ou null (pour APL/RSA)",
    "rib": "RIB ou IBAN (format FR + 25 chiffres ou 23 chiffres) ou null (pour APL/RSA)",
    "etablissement": "nom établissement scolaire/entreprise (si étudiant/salarié) ou null (pour APL)",
    
    "lieuNaissance": "lieu de naissance complet (ville, département) ou null (pour Passeport/CNI)",
    "taille": "taille en cm (nombre) ou null (pour Passeport/CNI)",
    "couleurYeux": "couleur des yeux (marron/bleu/vert/noisette) ou null (pour Passeport/CNI)",
    "photo": "confirmation photo identité disponible (oui/non/null) (pour Passeport/CNI)",
    "timbreFiscal": "confirmation achat timbre fiscal ou numéro timbre ou null (pour Passeport)",
    "ancienPasseport": "date expiration ancien passeport (format JJ/MM/AAAA) ou null (pour Passeport)",
    
    "nomEnfant": "nom de l'enfant ou null (pour Naissance)",
    "prenomEnfant": "prénom de l'enfant ou null (pour Naissance)",
    "dateNaissanceEnfant": "date naissance enfant (format JJ/MM/AAAA) ou null (pour Naissance)",
    "lieuNaissanceEnfant": "lieu naissance enfant (hôpital, ville) ou null (pour Naissance)",
    "nomMere": "nom mère ou null (pour Naissance)",
    "nomPere": "nom père ou null (pour Naissance)"
  }
}

RÈGLES D'EXTRACTION INTELLIGENTE:
1. **Extraire TOUS les champs mentionnés** dans la conversation, même si la démarche n'est pas encore identifiée
2. **Identifier la démarche automatiquement** selon les mots-clés:
   - "passeport", "renouvellement passeport" → Renouvellement passeport
   - "APL", "aide logement", "CAF" → Demande APL
   - "RSA", "revenu solidarité" → Demande RSA
   - "naissance", "déclarer naissance" → Déclaration naissance
   - "CNI", "carte identité", "carte nationale" → Demande CNI
   - "permis conduire" → Demande permis
3. **Extraire même dans phrases complexes**:
   - "Je m'appelle Jean Dubois, j'habite à Lyon 69003" → nom: "Dubois", prenom: "Jean", ville: "Lyon", codePostal: "69003"
   - "Je suis né le 12/07/1985 à Toulouse Haute-Garonne" → dateNaissance: "12/07/1985", lieuNaissance: "Toulouse, Haute-Garonne"
   - "Je mesure 178 cm" → taille: 178
   - "Yeux marron" ou "couleur yeux marron" → couleurYeux: "marron"
   - "J'ai une photo d'identité" ou "photo prête" → photo: "oui"
   - "Pas encore acheté timbre" → timbreFiscal: "non"
   - "Mon passeport expire le 15/11/2025" → ancienPasseport: "15/11/2025"
4. **Numéros et formats spéciaux**:
   - Numéro allocataire: "numéro allocataire 1234567" → numeroAllocataire: "1234567"
   - RIB: "RIB FR76 1234..." → rib: "FR76 1234..."
   - Sécurité sociale: "1 85 07 69 123 456 78" → numeroSecu: "1 85 07 69 123 456 78"

CRITÈRES POUR readyToStart = TRUE (SELON LA DÉMARCHE):

**Pour PASSEPORT/CNI:**
- nom, prenom, email, telephone, dateNaissance ✅
- lieuNaissance, taille, couleurYeux ✅
- adresseComplete, ville, codePostal ✅
- photo = "oui" ✅
- (timbreFiscal optionnel pour démarrer)

**Pour APL:**
- nom, prenom, email, telephone, dateNaissance ✅
- adresseComplete, ville, codePostal ✅
- situation, logement, loyer, charges, revenus ✅
- nomBailleur, dateEntree, surfaceLogement ✅

**Pour NAISSANCE:**
- nom, prenom des parents ✅
- nomEnfant, prenomEnfant, dateNaissanceEnfant, lieuNaissanceEnfant ✅
- adresseComplete ✅

**Pour RSA:**
- nom, prenom, email, telephone, dateNaissance ✅
- situation = "demandeur d'emploi" ✅
- revenus (même si 0) ✅
- numeroAllocataire, rib ✅

Critères pour userConfirmed = true:
- L'utilisateur confirme EXPLICITEMENT vouloir créer le dossier
- Expressions OUI: "oui", "ok", "d'accord", "vas-y", "lance", "je veux", "crée", "démarre", "go", "c'est bon", "c'est parti", "fais-le toi-même", "lance le processus"
- Expressions NON (hésitations): "oui mais...", "peut-être", "je sais pas", "attends"
- IMPORTANT: Si l'utilisateur dit "lance le processus" ou "fais-le pour moi" → userConfirmed = TRUE

EXEMPLES EXTRACTION:
Message: "Je veux renouveler mon passeport Pierre Leroy, né 12/07/1985 à Toulouse, j'habite 78 Rue République 69002 Lyon, je mesure 178 cm, yeux marron"
→ demarche: "Renouvellement passeport"
→ nom: "Leroy", prenom: "Pierre", dateNaissance: "12/07/1985"
→ lieuNaissance: "Toulouse", ville: "Lyon", codePostal: "69002"
→ adresseComplete: "78 Rue de la République, 69002 Lyon"
→ taille: 178, couleurYeux: "marron"
→ readyToStart: TRUE si email/tel/photo aussi renseignés

Message: "Lieu de naissance Toulouse, Haute Garonne. Taille 178 cm. Yeux marron. Oui j'ai une photo."
→ lieuNaissance: "Toulouse, Haute-Garonne"
→ taille: 178
→ couleurYeux: "marron"
→ photo: "oui"

RÈGLE CUMULATIVE:
- FUSIONNER toutes les infos de l'historique ET du message actuel
- Si un champ est mentionné plusieurs fois, prendre la DERNIÈRE valeur
- Ne JAMAIS perdre les infos déjà collectées dans les messages précédents`;

      const response = await this.vertexAI.generateResponse("CHAT", prompt, {
        temperature: 0.2, // Baissé pour plus de déterminisme
      });

      const cleanedResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Error analyzing intent:", error);
      return {
        demarche: "Inconnu",
        readyToStart: false,
        userConfirmed: false,
        confidence: 0,
        missingInfo: [],
        collectedInfo: {},
      };
    }
  }

  /**
   * Générer des steps détaillées et spécifiques à la démarche
   * NOUVELLE VERSION : Utilise l'IA pour générer des steps personnalisés
   * FALLBACK : Si l'IA échoue, utilise l'ancien système hardcodé (sécurité)
   */
  private async generateDetailedSteps(demarche: string, collectedInfo: any): Promise<any[]> {
    try {
      console.log(`🤖 Génération intelligente des steps pour: ${demarche}`);
      
      // Tentative de génération par IA
      const aiGeneratedSteps = await this.generateStepsWithAI(demarche, collectedInfo);
      
      if (aiGeneratedSteps && aiGeneratedSteps.length > 0) {
        console.log(`✅ ${aiGeneratedSteps.length} steps générés par IA avec succès`);
        return aiGeneratedSteps;
      }
      
      // Si IA échoue, fallback vers système hardcodé
      console.warn("⚠️ Génération IA échouée, utilisation du système de fallback");
      return this.generateDetailedStepsFallback(demarche, collectedInfo);
      
    } catch (error) {
      console.error("❌ Erreur génération steps avec IA:", error);
      console.log("🔄 Utilisation du système de fallback");
      return this.generateDetailedStepsFallback(demarche, collectedInfo);
    }
  }

  /**
   * Génération intelligente des steps via Vertex AI
   * Personnalise selon la démarche ET les données utilisateur
   */
  private async generateStepsWithAI(demarche: string, collectedInfo: any): Promise<any[]> {
    // Construire le contexte utilisateur de manière sécurisée
    const userContextSummary = this.buildUserContextSummary(collectedInfo);
    
    const prompt = `Tu es un expert en démarches administratives françaises. Ta mission est de générer les étapes DÉTAILLÉES et PERSONNALISÉES d'un processus administratif.

**DÉMARCHE À TRAITER :**
"${demarche}"

**CONTEXTE UTILISATEUR :**
${userContextSummary}

**INSTRUCTIONS CRITIQUES :**

1. **PERSONNALISATION OBLIGATOIRE** :
   - Intègre les données réelles (ville, montants, situation) dans les descriptions
   - Exemple BON : "Connexion au portail CAF Île-de-France (Paris)"
   - Exemple MAUVAIS : "Connexion au portail CAF" (trop générique)

2. **NOMBRE D'ÉTAPES** :
   - Génère EXACTEMENT 4 étapes (après l'étape 0 qui est l'analyse)
   - Ni plus, ni moins

3. **STRUCTURE OBLIGATOIRE** :
   - Étape 1 : Connexion/Accès au site administratif concerné
   - Étape 2 : Remplissage du formulaire (avec détails personnalisés)
   - Étape 3 : Validation/Vérification (avec critères spécifiques)
   - Étape 4 : Soumission/Finalisation

4. **SITES ADMINISTRATIFS FRANÇAIS** :
   - CAF : APL, RSA, allocations familiales, prime d'activité
   - Mairie : Naissance, mariage, décès, urbanisme
   - ANTS : Passeport, CNI, permis de conduire
   - Impots.gouv.fr : Déclaration revenus, taxes
   - Pôle Emploi : Inscription chômage, formations
   - CPAM/Ameli : Carte vitale, remboursements
   - Préfecture : Titres de séjour, naturalisation

5. **DESCRIPTIONS RÉVÉLATRICES** :
   - Chaque description doit montrer ce qui sera VRAIMENT fait
   - Inclure les montants, dates, lieux spécifiques
   - Expliquer brièvement la logique (ex: "Vérification éligibilité selon revenus")

**FORMAT DE RÉPONSE (JSON STRICT) :**

Retourne UNIQUEMENT un array JSON (sans texte avant/après, sans markdown) :

[
  {
    "id": "1",
    "name": "Nom court étape 1",
    "status": "pending",
    "order": 1,
    "description": "Description PERSONNALISÉE détaillée avec données réelles"
  },
  {
    "id": "2",
    "name": "Nom court étape 2",
    "status": "pending",
    "order": 2,
    "description": "Description PERSONNALISÉE détaillée avec données réelles"
  },
  {
    "id": "3",
    "name": "Nom court étape 3",
    "status": "pending",
    "order": 3,
    "description": "Description PERSONNALISÉE détaillée avec données réelles"
  },
  {
    "id": "4",
    "name": "Nom court étape 4",
    "status": "pending",
    "order": 4,
    "description": "Description PERSONNALISÉE détaillée avec données réelles"
  }
]

**EXEMPLE CONCRET pour "Demande APL à Paris, loyer 850€, revenus 1500€" :**

[
  {
    "id": "1",
    "name": "Connexion portail CAF Île-de-France",
    "status": "pending",
    "order": 1,
    "description": "Accès sécurisé au portail caf.fr spécifique à la région Île-de-France (Paris)"
  },
  {
    "id": "2",
    "name": "Déclaration logement Paris 850€",
    "status": "pending",
    "order": 2,
    "description": "Remplissage formulaire APL : identité, logement à Paris, loyer mensuel 850€, revenus déclarés 1500€"
  },
  {
    "id": "3",
    "name": "Validation éligibilité APL",
    "status": "pending",
    "order": 3,
    "description": "Vérification automatique : loyer/revenus ratio (850€/1500€ = 56%, conforme), situation familiale, conditions CAF"
  },
  {
    "id": "4",
    "name": "Soumission dossier APL",
    "status": "pending",
    "order": 4,
    "description": "Envoi sécurisé du dossier à la CAF Paris avec numéro de suivi, estimation traitement 5-10 jours"
  }
]

**IMPORTANT** :
- Retourne UNIQUEMENT le JSON array (pas de \`\`\`json, pas de texte explicatif)
- EXACTEMENT 4 étapes (id: "1" à "4")
- Tous les champs obligatoires présents (id, name, status, order, description)
- Descriptions PERSONNALISÉES avec données réelles du contexte

**ULTRA IMPORTANT** :
La démarche n'est pas forcément "Demande APL", adapte TOUT le prompt à la démarche fournie.
Ca peut être une déclaration de naissance, renouvellement de passeport, demande RSA, etc.
Donc adapte les étapes, sites, descriptions en fonction de la démarche exacte fournie.`;

    try {
      const response = await this.vertexAI.generateResponse("CHAT", prompt);
      
      // Nettoyer la réponse (enlever markdown, espaces, etc.)
      const cleanedResponse = this.cleanJsonResponse(response);
      
      // Parser le JSON
      const stepsArray = JSON.parse(cleanedResponse);
      
      // Validation stricte du format
      if (!this.validateStepsFormat(stepsArray)) {
        throw new Error("Format de steps invalide retourné par l'IA");
      }
      
      // Ajouter l'étape 0 (analyse) qui est toujours présente et completed
      const baseStep = {
        id: "0",
        name: "Analyse et vérification d'éligibilité",
        status: "completed",
        order: 0,
        description: `Collecte et vérification des informations pour ${demarche}`,
      };
      
      return [baseStep, ...stepsArray];
      
    } catch (error) {
      console.error("❌ Erreur lors de la génération IA des steps:", error);
      throw error; // Propager l'erreur pour déclencher le fallback
    }
  }

  /**
   * Construit un résumé du contexte utilisateur pour le prompt IA
   */
  private buildUserContextSummary(collectedInfo: any): string {
    const summary: string[] = [];
    
    // Informations personnelles
    if (collectedInfo.nom || collectedInfo.prenom) {
      summary.push(`- Identité : ${collectedInfo.prenom || "?"} ${collectedInfo.nom || "?"}`);
    }
    
    // Localisation
    if (collectedInfo.ville) {
      summary.push(`- Ville : ${collectedInfo.ville}`);
      if (collectedInfo.codePostal) {
        summary.push(`- Code postal : ${collectedInfo.codePostal}`);
      }
    }
    
    // Situation
    if (collectedInfo.situation) {
      summary.push(`- Situation : ${collectedInfo.situation}`);
    }
    
    // Logement (pour APL, etc.)
    if (collectedInfo.loyer) {
      summary.push(`- Loyer mensuel : ${collectedInfo.loyer}€`);
    }
    if (collectedInfo.logement) {
      summary.push(`- Type logement : ${collectedInfo.logement}`);
    }
    
    // Revenus
    if (collectedInfo.revenus) {
      summary.push(`- Revenus mensuels : ${collectedInfo.revenus}€`);
    }
    
    // Enfants (pour allocations, naissance, etc.)
    if (collectedInfo.nomEnfant || collectedInfo.prenomEnfant) {
      summary.push(`- Enfant : ${collectedInfo.prenomEnfant || "?"} ${collectedInfo.nomEnfant || "?"}`);
    }
    if (collectedInfo.dateNaissanceEnfant) {
      summary.push(`- Date naissance enfant : ${collectedInfo.dateNaissanceEnfant}`);
    }
    
    // Autres infos pertinentes
    if (collectedInfo.dateEntree) {
      summary.push(`- Date entrée logement : ${collectedInfo.dateEntree}`);
    }
    
    return summary.length > 0 ? summary.join("\n") : "Aucune information spécifique disponible";
  }

  /**
   * Valide que le format des steps retournés par l'IA est correct
   */
  private validateStepsFormat(steps: any): boolean {
    try {
      // Vérifier que c'est un array
      if (!Array.isArray(steps)) {
        console.error("❌ Steps n'est pas un array");
        return false;
      }
      
      // Vérifier qu'il y a au moins 3 étapes et max 6
      if (steps.length < 3 || steps.length > 6) {
        console.error(`❌ Nombre de steps invalide: ${steps.length} (attendu: 3-6)`);
        return false;
      }
      
      // Vérifier chaque step
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Vérifier présence des champs obligatoires
        if (!step.id || !step.name || !step.status || step.order === undefined || !step.description) {
          console.error(`❌ Step ${i} invalide, champs manquants:`, step);
          return false;
        }
        
        // Vérifier types
        if (typeof step.id !== "string" || 
            typeof step.name !== "string" || 
            typeof step.status !== "string" || 
            typeof step.order !== "number" || 
            typeof step.description !== "string") {
          console.error(`❌ Step ${i} invalide, types incorrects:`, step);
          return false;
        }
        
        // Vérifier que status est "pending"
        if (step.status !== "pending") {
          console.warn(`⚠️ Step ${i} status n'est pas "pending", correction automatique`);
          step.status = "pending";
        }
      }
      
      return true;
      
    } catch (error) {
      console.error("❌ Erreur validation steps:", error);
      return false;
    }
  }

  /**
   * Système de fallback : génération hardcodée des steps (ancien système)
   * Utilisé si l'IA échoue pour garantir la robustesse
   */
  private generateDetailedStepsFallback(demarche: string, collectedInfo: any): any[] {
    console.log("🔄 Utilisation du système de fallback (steps hardcodés)");
    
    // Étape 0 toujours présente: Analyse
    const baseSteps = [
      {
        id: "0",
        name: "Analyse et vérification d'éligibilité",
        status: "completed",
        order: 0,
        description: `Collecte et vérification des informations pour ${demarche}`,
      },
    ];

    // Étapes spécifiques selon le type de démarche
    let specificSteps: any[] = [];

    if (demarche.toLowerCase().includes("apl") || demarche.toLowerCase().includes("aide au logement")) {
      specificSteps = [
        {
          id: "1",
          name: "Connexion au site de la CAF",
          status: "pending",
          order: 1,
          description: "Accès sécurisé au portail caf.fr avec vos identifiants",
        },
        {
          id: "2",
          name: "Remplissage formulaire APL",
          status: "pending",
          order: 2,
          description: `Saisie automatique: identité, logement à ${collectedInfo.ville || "votre ville"}, loyer ${collectedInfo.loyer || "..."}€`,
        },
        {
          id: "3",
          name: "Validation des données CAF",
          status: "pending",
          order: 3,
          description: "Vérification automatique éligibilité APL selon revenus et situation",
        },
        {
          id: "4",
          name: "Soumission du dossier",
          status: "pending",
          order: 4,
          description: "Envoi sécurisé à la CAF et confirmation de réception",
        },
      ];
    } else if (demarche.toLowerCase().includes("naissance") || demarche.toLowerCase().includes("déclaration")) {
      specificSteps = [
        {
          id: "1",
          name: "Connexion au site de la Mairie",
          status: "pending",
          order: 1,
          description: `Accès au portail mairie de ${collectedInfo.ville || "votre commune"}`,
        },
        {
          id: "2",
          name: "Déclaration de naissance",
          status: "pending",
          order: 2,
          description: "Saisie informations enfant, parents et lieu de naissance",
        },
        {
          id: "3",
          name: "Upload documents justificatifs",
          status: "pending",
          order: 3,
          description: "Téléversement certificat médical et pièces d'identité",
        },
        {
          id: "4",
          name: "Prise de rendez-vous",
          status: "pending",
          order: 4,
          description: "Sélection automatique du créneau disponible",
        },
      ];
    } else {
      // Étapes génériques si démarche inconnue
      specificSteps = [
        {
          id: "1",
          name: "Connexion au portail administratif",
          status: "pending",
          order: 1,
          description: "Accès sécurisé au site officiel",
        },
        {
          id: "2",
          name: "Remplissage du formulaire",
          status: "pending",
          order: 2,
          description: "Saisie automatique de vos informations",
        },
        {
          id: "3",
          name: "Validation et soumission",
          status: "pending",
          order: 3,
          description: "Vérification et envoi du dossier",
        },
      ];
    }

    return [...baseSteps, ...specificSteps];
  }

  /**
   * Créer un processus automatiquement depuis la conversation
   */
  private async createProcessFromConversation(
    sessionId: string,
    intentAnalysis: any,
    providedUserId?: string  // ✅ NOUVEAU : userId passé depuis le trigger
  ): Promise<void> {
    try {
      // 1. Récupérer userId : priorité au providedUserId, sinon fallback sur first message
      let userId = providedUserId;
      
      if (!userId) {
        console.log("⚠️ userId non fourni, recherche dans les messages...");
        const messagesSnapshot = await this.db
          .collection("messages")
          .where("sessionId", "==", sessionId)
          .orderBy("timestamp", "asc")
          .limit(1)
          .get();

        if (messagesSnapshot.empty) {
          throw new Error("No messages found for session");
        }

        const firstMessage = messagesSnapshot.docs[0].data();
        userId = firstMessage.userId;
      }

      // STRICT : userId est obligatoire
      if (!userId) {
        throw new Error("userId manquant - l'utilisateur doit être authentifié");
      }
      
      console.log(`✅ userId récupéré : ${userId}`);

      // 2. Créer le processus avec steps **détaillées et spécifiques à la démarche**
      console.log(`🤖 Génération des steps pour: ${intentAnalysis.demarche}`);
      const steps = await this.generateDetailedSteps(intentAnalysis.demarche, intentAnalysis.collectedInfo);
      
      console.log(`🔍 [ChatAgent] Steps générées:`, JSON.stringify(steps, null, 2));
      
      const processData = {
        title: intentAnalysis.demarche,
        userId: userId,
        sessionId: sessionId,
        status: "created",
        description: `Demande de ${intentAnalysis.demarche}`,
        userContext: intentAnalysis.collectedInfo,
        steps: steps,
        currentStepIndex: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      console.log(`🔍 [ChatAgent] processData AVANT .add():`, JSON.stringify(processData, null, 2));

      const processRef = await this.db.collection("processes").add(processData);

      console.log(`✅ Processus créé avec succès:`, {
        processId: processRef.id,
        userId: userId,
        sessionId: sessionId,
        title: intentAnalysis.demarche,
        status: "created",
        stepsCount: steps.length
      });

      // 3. Envoyer message de confirmation généré par l'IA
      await this.generateAndSendConfirmationMessage(sessionId, intentAnalysis);
    } catch (error) {
      console.error("Error creating process:", error);
      throw error;
    }
  }

  /**
   * Générer et envoyer un message de confirmation personnalisé
   */
  private async generateAndSendConfirmationMessage(
    sessionId: string,
    intentAnalysis: any
  ): Promise<void> {
    const organism = this.getOrganismForDemarche(intentAnalysis.demarche);
    const documents = this.getDocumentsList(intentAnalysis.demarche);

    const confirmationMessage = `🎉 **Félicitations ! Votre dossier "${intentAnalysis.demarche}" a été créé avec succès.**

✅ **SimplifIA s'occupe de tout pour vous :**

1️⃣ **Connexion automatique** au site ${organism}
2️⃣ **Remplissage automatique** du formulaire avec vos informations
3️⃣ **Soumission sécurisée** de votre dossier
4️⃣ **Suivi en temps réel** de l'avancement

📋 **Documents nécessaires :** 
${documents}

⏱️ **Temps estimé :** 2-3 minutes (au lieu de 45 minutes manuellement)

📊 **Vous pouvez suivre la progression en direct :**
- Chaque étape s'affiche en temps réel sur votre tableau de bord
- Vous serez notifié à chaque validation
- Un récapitulatif complet vous sera envoyé à la fin

🚀 **Le processus démarre maintenant automatiquement...**

_Vous n'avez rien à faire, SimplifIA gère toute la démarche administrative pour vous !_`;

    await this.addAgentResponse(sessionId, confirmationMessage);
  }

  /**
   * Ajouter une réponse de l'agent au chat
   */
  private async addAgentResponse(
    sessionId: string,
    content: string
  ): Promise<void> {
    await this.db.collection("messages").add({
      sessionId,
      role: "agent",
      content,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        isTyping: false,
        suggestedActions: ["Continuer"],
      },
    });
  }

  /**
   * Formater le nom d'un champ pour affichage utilisateur
   */
  private formatFieldName(fieldName: string): string {
    const fieldNames: Record<string, string> = {
      nom: "Nom",
      prenom: "Prénom",
      email: "Email",
      telephone: "Téléphone",
      dateNaissance: "Date de naissance",
      situation: "Situation professionnelle",
      logement: "Type de logement",
      adresseComplete: "Adresse complète",
      ville: "Ville",
      codePostal: "Code postal",
      loyer: "Loyer mensuel",
      charges: "Charges mensuelles",
      revenus: "Revenus mensuels",
      nomBailleur: "Nom du bailleur",
      dateEntree: "Date d'entrée dans le logement",
      surfaceLogement: "Surface du logement (m²)",
      numeroSecu: "Numéro de sécurité sociale",
      etablissement: "Établissement",
      statut: "Statut",
      montant: "Montant",
      garant: "Garant",
    };
    return fieldNames[fieldName] || fieldName;
  }

  /**
   * Obtenir le nom de l'organisme pour une démarche
   */
  private getOrganismForDemarche(demarche: string): string {
    const lowerDemarche = demarche.toLowerCase();

    // CAF (Caisse d'Allocations Familiales)
    if (lowerDemarche.includes("apl") || 
        lowerDemarche.includes("aide au logement") ||
        lowerDemarche.includes("caf") || 
        lowerDemarche.includes("rsa") ||
        lowerDemarche.includes("allocation familiale") ||
        lowerDemarche.includes("prime d'activité") ||
        lowerDemarche.includes("aah")) {
      return "CAF (Caisse d'Allocations Familiales)";
    }
    
    // ANTS (Agence Nationale des Titres Sécurisés)
    if (lowerDemarche.includes("passeport") || 
        lowerDemarche.includes("carte d'identité") || 
        lowerDemarche.includes("cni") ||
        lowerDemarche.includes("permis de conduire") ||
        lowerDemarche.includes("titre de voyage")) {
      return "ANTS (Agence Nationale des Titres Sécurisés)";
    }
    
    // Impôts (Direction Générale des Finances Publiques)
    if (lowerDemarche.includes("impôt") || 
        lowerDemarche.includes("taxe") ||
        lowerDemarche.includes("déclaration revenus") ||
        lowerDemarche.includes("dgfip")) {
      return "Impots.gouv.fr";
    }
    
    // Assurance Maladie / Sécurité Sociale
    if (lowerDemarche.includes("sécurité sociale") || 
        lowerDemarche.includes("ameli") ||
        lowerDemarche.includes("carte vitale") ||
        lowerDemarche.includes("remboursement") ||
        lowerDemarche.includes("cpam")) {
      return "Ameli (Sécurité Sociale)";
    }
    
    // Pôle Emploi
    if (lowerDemarche.includes("pole emploi") || 
        lowerDemarche.includes("pôle emploi") ||
        lowerDemarche.includes("chômage") ||
        lowerDemarche.includes("inscription demandeur") ||
        lowerDemarche.includes("actualisation")) {
      return "Pôle Emploi";
    }
    
    // Préfecture
    if (lowerDemarche.includes("titre de séjour") || 
        lowerDemarche.includes("carte de séjour") ||
        lowerDemarche.includes("préfecture") ||
        lowerDemarche.includes("carte grise") ||
        lowerDemarche.includes("certificat d'immatriculation")) {
      return "Préfecture";
    }
    
    // URSSAF
    if (lowerDemarche.includes("urssaf") || 
        lowerDemarche.includes("auto-entrepreneur") ||
        lowerDemarche.includes("micro-entreprise") ||
        lowerDemarche.includes("cotisation sociale")) {
      return "URSSAF";
    }

    return "l'organisme administratif concerné";
  }

  /**
   * Obtenir la liste des documents nécessaires pour une démarche
   */
  private getDocumentsList(demarche: string): string {
    const lowerDemarche = demarche.toLowerCase();
    
    // CAF - APL / Aide au logement
    if (lowerDemarche.includes("apl") || lowerDemarche.includes("aide au logement")) {
      return "Bail de location, RIB, Avis d'imposition N-1, Justificatif de domicile, Pièce d'identité";
    }
    
    // CAF - RSA
    if (lowerDemarche.includes("rsa")) {
      return "RIB, Justificatif de domicile, Pièce d'identité, Attestation Pôle Emploi (si inscrit), Relevé d'identité bancaire";
    }
    
    // CAF - Allocations familiales
    if (lowerDemarche.includes("allocation familiale")) {
      return "Livret de famille, RIB, Justificatif de domicile, Avis d'imposition";
    }
    
    // CAF - Prime d'activité
    if (lowerDemarche.includes("prime d'activité")) {
      return "Bulletins de salaire (3 derniers mois), RIB, Avis d'imposition, Justificatif de domicile";
    }
    
    // ANTS - Passeport (renouvellement)
    if (lowerDemarche.includes("passeport") && (lowerDemarche.includes("renouvellement") || lowerDemarche.includes("renouveler"))) {
      return "Ancien passeport, Photo d'identité (format ANTS), Justificatif de domicile de moins de 6 mois, Timbre fiscal électronique (86€)";
    }
    
    // ANTS - Passeport (première demande)
    if (lowerDemarche.includes("passeport")) {
      return "Acte de naissance, Photo d'identité (format ANTS), Justificatif de domicile de moins de 6 mois, Pièce d'identité, Timbre fiscal électronique (86€)";
    }
    
    // ANTS - Carte d'identité
    if (lowerDemarche.includes("carte d'identité") || lowerDemarche.includes("cni")) {
      return "Ancien titre (CNI ou passeport), Photo d'identité (format ANTS), Justificatif de domicile de moins de 6 mois";
    }
    
    // ANTS - Permis de conduire
    if (lowerDemarche.includes("permis de conduire")) {
      return "Pièce d'identité, Justificatif de domicile, Photo d'identité (format ANTS), Attestation de formation (code + conduite)";
    }
    
    // Impôts - Déclaration de revenus
    if (lowerDemarche.includes("déclaration") && lowerDemarche.includes("revenus")) {
      return "Justificatifs de revenus (salaires, pensions, etc.), Justificatifs de charges déductibles, RIB pour remboursement";
    }
    
    // Sécu - Carte Vitale
    if (lowerDemarche.includes("carte vitale")) {
      return "Pièce d'identité, Justificatif de domicile, RIB, Photo d'identité";
    }
    
    // Sécu - Remboursement
    if (lowerDemarche.includes("remboursement")) {
      return "Feuille de soins, Ordonnance, Factures, RIB, Carte Vitale";
    }
    
    // Pôle Emploi - Inscription
    if (lowerDemarche.includes("inscription") && (lowerDemarche.includes("chômage") || lowerDemarche.includes("pole emploi"))) {
      return "Attestation employeur (certificat de travail), RIB, Pièce d'identité, CV, Justificatif de domicile";
    }
    
    // Préfecture - Titre de séjour
    if (lowerDemarche.includes("titre de séjour") || lowerDemarche.includes("carte de séjour")) {
      return "Passeport, Visa (si applicable), Justificatif de domicile, Photos d'identité, Justificatif de ressources, Attestation d'assurance maladie";
    }
    
    // Préfecture - Carte grise
    if (lowerDemarche.includes("carte grise") || lowerDemarche.includes("certificat d'immatriculation")) {
      return "Certificat de cession (si occasion), Justificatif de domicile, Pièce d'identité, Contrôle technique (si + 4 ans), Justificatif d'assurance";
    }
    
    // URSSAF - Auto-entrepreneur
    if (lowerDemarche.includes("auto-entrepreneur") || lowerDemarche.includes("micro-entreprise")) {
      return "Pièce d'identité, RIB, Justificatif de domicile, Déclaration d'activité (formulaire P0)";
    }
    
    // Défaut générique
    return "Documents à définir selon votre situation (nous vous guiderons)";
  }
}
