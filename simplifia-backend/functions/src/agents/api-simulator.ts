// Agent de simulation d'API - Simule les réponses des sites administratifs
import { VertexAIService } from "../services/vertex-ai";

/**
 * APISimulatorAgent
 * 
 * Simule les réponses des sites administratifs (CAF, ANTS, Impôts, Sécu)
 * pour permettre de tester le workflow sans dépendre d'APIs externes.
 * 
 * Utilise Vertex AI pour générer des réponses JSON réalistes basées sur
 * le contexte de chaque site administratif.
 */
export class APISimulatorAgent {
  private vertexAI: VertexAIService;

  constructor() {
    this.vertexAI = new VertexAIService();
  }

  /**
   * Simule un appel API à un site administratif
   * 
   * @param siteName - Le site à simuler (CAF, ANTS, IMPOTS, SECU, POLE_EMPLOI, PREFECTURE, URSSAF)
   * @param endpoint - L'endpoint API simulé
   * @param userData - Les données utilisateur à envoyer
   * @returns Réponse JSON simulée du site
   */
  async simulateAPICall(
    siteName: "CAF" | "ANTS" | "IMPOTS" | "SECU" | "POLE_EMPLOI" | "PREFECTURE" | "URSSAF",
    endpoint: string,
    userData: any
  ): Promise<any> {
    const siteContext = this.getSiteContext(siteName);

    const prompt = `Tu es l'API du site ${siteName}.

Contexte du site:
${siteContext}

Endpoint appelé: ${endpoint}
Données reçues: ${JSON.stringify(userData, null, 2)}

Génère une réponse JSON réaliste comme le ferait vraiment l'API de ce site.

RÈGLES IMPORTANTES:
1. statut "success" = demande enregistrée/pré-demande acceptée (même si documents manquants)
2. statut "error" = demande REJETÉE (critères non remplis, revenus trop élevés, etc.)
3. Si success mais documents manquants: mets-les dans documentsManquants ET dans le message
4. numeroDossier: TOUJOURS générer un numéro (format ${this.getNumeroFormat(siteName)}) sauf si error critique

STRUCTURE JSON EXACTE (format compact sur UNE SEULE LIGNE):
{"statut":"success ou error","numeroDossier":"format correct","message":"texte court sans retour ligne","prochainEtape":"action suivante","delaiEstime":"délai","documentsManquants":["doc1","doc2"]}

CRITICAL: 
- JSON COMPACT sur UNE SEULE LIGNE (pas de retours à la ligne, pas d'indentation)
- Messages courts et concis (max 200 caractères)
- JAMAIS de \\n, \\r, ou retour à la ligne dans les valeurs
- JAMAIS de markdown, backticks, ou commentaires
- Réponse = JSON brut uniquement

JSON:`;

    try {
      const response = await this.vertexAI.generateResponse("NAVIGATOR", prompt, {
        temperature: 0.2, // Très déterministe pour cohérence
      });

      // Nettoyer la réponse (enlever markdown si présent)
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, "");
      }

      // Supprimer TOUS les retours à la ligne et espaces multiples
      // pour forcer le JSON sur une seule ligne
      cleanedResponse = cleanedResponse
        .replace(/\n/g, " ")  // Remplacer \n par espace
        .replace(/\r/g, " ")  // Remplacer \r par espace
        .replace(/\s{2,}/g, " ")  // Compacter espaces multiples
        .trim();

      // Parser le JSON
      const parsedResponse = JSON.parse(cleanedResponse);

      console.log(`✅ API Simulator (${siteName}): ${parsedResponse.statut}`);

      return parsedResponse;
    } catch (error) {
      console.error(`❌ Invalid JSON from API simulator for ${siteName}:`, error);

      // Fallback en cas d'erreur de parsing
      return {
        statut: "error",
        numeroDossier: "",
        message: "Erreur de simulation API - Réponse invalide",
        prochainEtape: "Réessayer la connexion",
        delaiEstime: "N/A",
        documentsManquants: [],
      };
    }
  }

  /**
   * Retourne le contexte spécifique à chaque site administratif
   */
  private getSiteContext(siteName: string): string {
    const contexts = {
      CAF: `Caisse d'Allocations Familiales (caf.fr)
      
Services principaux:
- RSA (Revenu de Solidarité Active)
- APL (Aide Personnalisée au Logement)
- Prime d'activité
- Allocations familiales
- Complement familial

Documents requis typiques:
- RIB (IBAN français valide)
- Justificatif de domicile (bail, quittance loyer)
- Avis d'imposition année N-1
- Pièce d'identité
- Attestation Pôle Emploi (si RSA)

Délais de traitement:
- Instruction dossier: 2 mois
- Premier versement: 3 mois
- Réponse initiale: 15 jours

Format numéro de dossier: CAF-2025-XXXXXX (6 chiffres aléatoires)

Critères d'éligibilité APL:
- Ressources < plafond (dépend composition familiale)
- Locataire ou colocataire
- Logement décent
- Loyer pas trop élevé`,

      ANTS: `Agence Nationale des Titres Sécurisés (ants.gouv.fr)

Services principaux:
- Passeport biométrique
- Carte nationale d'identité (CNI)
- Permis de conduire
- Certificat d'immatriculation (carte grise)

Documents requis typiques:
- Photo d'identité conforme (norme ISO)
- Justificatif de domicile (< 6 mois)
- Ancien titre (carte/passeport périmé)
- Acte de naissance (si 1ère demande)
- Timbre fiscal (pour passeport: 86€ adulte)

Délais de traitement:
- Passeport: 3-6 semaines
- CNI: 3-6 semaines
- Permis: 2-3 semaines
- Carte grise: 1-2 semaines

Format numéro de dossier: ANTS-PASS-XXXXXX (pour passeport) ou ANTS-CNI-XXXXXX

Critères validation:
- Photo récente (< 6 mois)
- Justificatif domicile récent
- Empreintes digitales (prise en mairie)`,

      IMPOTS: `Direction Générale des Finances Publiques (impots.gouv.fr)

Services principaux:
- Déclaration de revenus (annuelle)
- Demande de remboursement
- Prélèvement à la source
- Taxe d'habitation
- Taxe foncière

Documents requis typiques:
- Justificatifs de revenus (bulletins salaire, pensions)
- Justificatifs de charges (dons, travaux, garde enfants)
- Coordonnées bancaires (RIB)
- Avis d'imposition année précédente

Délais de traitement:
- Déclaration en ligne: jusqu'à fin mai
- Remboursement: 3-6 mois
- Réponse contestation: 6 mois
- Régularisation: 2-4 mois

Format numéro de dossier: DGFIP-2025-XXXXXX

Dates limites déclaration:
- Zone 1: fin mai
- Zone 2: début juin
- Zone 3: mi-juin`,

      SECU: `Assurance Maladie / Sécurité Sociale (ameli.fr)

Services principaux:
- Remboursements soins médicaux
- Carte Vitale
- Affiliation régime général
- Arrêts de travail
- Prise en charge ALD (Affection Longue Durée)

Documents requis typiques:
- RIB (pour remboursements)
- Justificatif d'identité
- Justificatif de domicile
- Certificat de naissance (affiliation)
- Prescription médicale (ALD)

Délais de traitement:
- Remboursements: 5-7 jours ouvrés
- Carte Vitale: 2-4 semaines
- Affiliation: 2-3 semaines
- Réponse ALD: 4-6 semaines

Format numéro de dossier: SECU-2025-XXXXXX

Taux de remboursement:
- Médecin généraliste: 70% (25€)
- Spécialiste: 70% (30-50€)
- Pharmacie: 65% (médicaments)
- Hospitalisation: 80%`,

      POLE_EMPLOI: `Pôle Emploi (pole-emploi.fr)

Services principaux:
- Inscription demandeur d'emploi
- Actualisation mensuelle
- Allocation chômage (ARE)
- Aide à la création d'entreprise (ACRE)
- Formation professionnelle

Documents requis typiques:
- Pièce d'identité
- RIB
- Attestation employeur (fin de contrat)
- CV actualisé
- Certificat de travail

Délais de traitement:
- Inscription: Immédiat en ligne
- Premier versement ARE: 7-10 jours après délai carence
- Réponse formation: 2-4 semaines
- Décision ACRE: 1 mois

Format numéro de dossier: PE-2025-XXXXXX

Critères ARE:
- Minimum 6 mois travaillés sur 24 derniers mois
- Involontairement privé d'emploi
- Recherche active d'emploi
- Inscription dans les 12 mois après fin contrat`,

      PREFECTURE: `Préfecture (interieur.gouv.fr)

Services principaux:
- Titre de séjour
- Carte de résident
- Naturalisation française
- Certificat d'immatriculation (carte grise)
- Changement d'adresse carte grise

Documents requis typiques:
- Pièce d'identité
- Justificatif de domicile (< 3 mois)
- Photos d'identité
- Contrat de travail (titre séjour)
- Certificat de cession (vente véhicule)

Délais de traitement:
- Titre de séjour: 2-4 mois
- Naturalisation: 12-18 mois
- Carte grise: 1-2 semaines
- Changement adresse: Immédiat en ligne

Format numéro de dossier: PREF-2025-XXXXXX

Rendez-vous:
- Obligatoire pour titre séjour
- Prise RDV en ligne
- Délais d'attente: 2-8 semaines selon préfecture`,

      URSSAF: `URSSAF (urssaf.fr / autoentrepreneur.urssaf.fr)

Services principaux:
- Inscription auto-entrepreneur
- Déclaration chiffre d'affaires
- Paiement cotisations sociales
- SIRET / SIREN
- CFE (Cotisation Foncière Entreprises)

Documents requis typiques:
- Pièce d'identité
- Justificatif de domicile
- RIB
- Diplômes (activités réglementées)
- Attestation de stage SPI (si requis)

Délais de traitement:
- Immatriculation: 1-2 semaines
- Réception SIRET: 8-15 jours
- Activation compte: 4-6 semaines
- Réponse demande ACRE: 1 mois

Format numéro de dossier: URSSAF-2025-XXXXXX ou SIRET (14 chiffres)

Cotisations sociales:
- Vente marchandises: 12.3%
- Prestations services BIC: 21.2%
- Prestations services BNC: 21.1%
- Professions libérales: 21.2%
- Déclaration: mensuelle ou trimestrielle`,
    };

    return contexts[siteName as keyof typeof contexts];
  }

  /**
   * Retourne le format de numéro de dossier pour chaque site
   */
  private getNumeroFormat(siteName: string): string {
    const formats = {
      CAF: "CAF-2025-XXXXXX",
      ANTS: "ANTS-PASS-XXXXXX ou ANTS-CNI-XXXXXX",
      IMPOTS: "DGFIP-2025-XXXXXX",
      SECU: "SECU-2025-XXXXXX",
      POLE_EMPLOI: "PE-2025-XXXXXX",
      PREFECTURE: "PREF-2025-XXXXXX",
      URSSAF: "URSSAF-2025-XXXXXX ou SIRET",
    };

    return formats[siteName as keyof typeof formats];
  }
}
