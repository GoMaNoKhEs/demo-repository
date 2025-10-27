// Logique métier pour vérification d'éligibilité aux démarches administratives françaises

/**
 * Résultat de vérification d'éligibilité
 */
export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  missingDocuments?: string[];
  warnings?: string[];
}

/**
 * Classe utilitaire pour vérifier l'éligibilité aux démarches administratives
 */
export class EligibilityChecker {
  /**
   * Vérifie l'éligibilité pour CAF (APL, RSA, etc.)
   */
  static checkCAF(userData: any, typeAide: string): EligibilityResult {
    const revenus = userData.revenus_mensuels || userData.revenus || 0;
    const loyer = userData.loyer || userData.revenus_logement || 0;
    const situation = (userData.situation || "").toLowerCase();

    // APL (Aide Personnalisée au Logement)
    if (typeAide.toLowerCase().includes("apl") || loyer > 0) {
      // Règle 1: Loyer doit être > 0
      if (loyer <= 0) {
        return {
          eligible: false,
          reason: "Loyer non spécifié ou invalide pour une demande d'APL",
        };
      }

      // Règle 2: Loyer doit être < Revenus × 3
      if (revenus > 0 && loyer > revenus * 3) {
        return {
          eligible: false,
          reason: `Loyer trop élevé (${loyer}€) par rapport aux revenus (${revenus}€). Ratio maximum: 33% des revenus`,
        };
      }

      // Règle 3: Vérifier propriétaire vs locataire
      if (situation.includes("propriétaire")) {
        return {
          eligible: false,
          reason: "L'APL est réservée aux locataires, colocataires ou résidents en foyer",
        };
      }

      // Éligible mais peut-être partielle
      const warnings: string[] = [];
      if (revenus > 1500) {
        warnings.push("Montant APL réduit selon barème CAF pour revenus > 1500€/mois");
      }

      return {
        eligible: true,
        warnings,
      };
    }

    // RSA (Revenu de Solidarité Active)
    if (typeAide.toLowerCase().includes("rsa")) {
      // Règle 1: Revenus <= 607€/mois (seuil RSA 2025 personne seule)
      const seuilRSA = 607;

      if (revenus > seuilRSA) {
        return {
          eligible: false,
          reason: `Revenus trop élevés (${revenus}€) pour le RSA. Plafond: ${seuilRSA}€/mois pour une personne seule`,
        };
      }

      // Règle 2: Âge minimum 25 ans (sauf exceptions)
      const age = userData.age || 0;
      if (age > 0 && age < 25) {
        const hasChildren = userData.enfants > 0 || situation.includes("parent");
        if (!hasChildren) {
          return {
            eligible: false,
            reason: "RSA réservé aux 25 ans et plus (sauf jeunes parents ou femmes enceintes)",
          };
        }
      }

      return { eligible: true };
    }

    // Prime d'activité
    if (typeAide.toLowerCase().includes("prime d'activité") || typeAide.toLowerCase().includes("prime activite")) {
      if (revenus <= 0) {
        return {
          eligible: false,
          reason: "Prime d'activité réservée aux travailleurs avec revenus d'activité",
        };
      }

      if (revenus > 1800) {
        return {
          eligible: false,
          reason: "Revenus trop élevés pour la prime d'activité (plafond ~1800€/mois pour personne seule)",
        };
      }

      return { eligible: true };
    }

    // Par défaut: éligible (autres aides CAF)
    return { eligible: true };
  }

  /**
   * Vérifie l'éligibilité pour Pôle Emploi
   */
  static checkPoleEmploi(userData: any): EligibilityResult {
    const missingDocs: string[] = [];

    // Vérifier attestation employeur (obligatoire pour ARE)
    if (!userData.attestation_employeur && !userData.certificat_travail) {
      missingDocs.push("Attestation employeur / Certificat de travail");
    }

    // Vérifier pièce d'identité
    if (!userData.piece_identite && !userData.nom) {
      missingDocs.push("Pièce d'identité");
    }

    // Vérifier RIB
    if (!userData.rib) {
      missingDocs.push("RIB");
    }

    if (missingDocs.length > 0) {
      return {
        eligible: false,
        reason: "Documents manquants pour inscription",
        missingDocuments: missingDocs,
      };
    }

    return { eligible: true };
  }

  /**
   * Vérifie l'éligibilité pour ANTS (Passeport, CNI)
   */
  static checkANTS(userData: any, typeDocument: string): EligibilityResult {
    const missingDocs: string[] = [];

    // Photo d'identité (obligatoire)
    if (!userData.photo_identite) {
      missingDocs.push("Photo d'identité (format ANTS)");
    }

    // Justificatif domicile
    if (!userData.justificatif_domicile && !userData.adresse) {
      missingDocs.push("Justificatif de domicile de moins de 6 mois");
    }

    // Passeport: vérifier ancien titre si renouvellement
    if (typeDocument.toLowerCase().includes("passeport")) {
      if (!userData.ancien_passeport && typeDocument.toLowerCase().includes("renouvellement")) {
        missingDocs.push("Ancien passeport");
      }
    }

    if (missingDocs.length > 0) {
      return {
        eligible: true, // Éligible mais docs manquants
        reason: "Documents manquants à fournir avant soumission",
        missingDocuments: missingDocs,
      };
    }

    return { eligible: true };
  }

  /**
   * Vérifie l'éligibilité pour Sécurité Sociale / CPAM
   */
  static checkSECU(userData: any): EligibilityResult {
    const missingDocs: string[] = [];

    // Numéro de sécurité sociale (pour remboursements)
    if (!userData.numero_secu && !userData.numeroSecu) {
      missingDocs.push("Numéro de sécurité sociale");
    }

    // RIB (pour remboursements)
    if (!userData.rib) {
      missingDocs.push("RIB");
    }

    if (missingDocs.length > 0) {
      return {
        eligible: true, // Éligible mais docs manquants
        reason: "Documents manquants pour traitement",
        missingDocuments: missingDocs,
      };
    }

    return { eligible: true };
  }

  /**
   * Vérifie l'éligibilité pour Impôts
   */
  static checkImpots(userData: any): EligibilityResult {
    const missingDocs: string[] = [];

    // Numéro fiscal
    if (!userData.numero_fiscal) {
      missingDocs.push("Numéro fiscal");
    }

    // Revenus annuels
    if (!userData.revenus_annuels && !userData.revenus) {
      missingDocs.push("Justificatifs de revenus");
    }

    if (missingDocs.length > 0) {
      return {
        eligible: true, // Éligible mais docs manquants
        reason: "Documents manquants pour déclaration",
        missingDocuments: missingDocs,
      };
    }

    return { eligible: true };
  }

  /**
   * Vérifie l'éligibilité pour Préfecture
   */
  static checkPrefecture(userData: any, typeService: string): EligibilityResult {
    const missingDocs: string[] = [];

    // Titre de séjour
    if (typeService.toLowerCase().includes("titre") || typeService.toLowerCase().includes("séjour")) {
      if (!userData.passeport) {
        missingDocs.push("Passeport");
      }
      if (!userData.justificatif_ressources) {
        missingDocs.push("Justificatif de ressources");
      }
    }

    // Carte grise
    if (typeService.toLowerCase().includes("carte grise") || typeService.toLowerCase().includes("immatriculation")) {
      if (!userData.certificat_immatriculation && !userData.carte_grise_ancienne) {
        missingDocs.push("Ancien certificat d'immatriculation");
      }
    }

    if (missingDocs.length > 0) {
      return {
        eligible: true,
        reason: "Documents manquants à fournir",
        missingDocuments: missingDocs,
      };
    }

    return { eligible: true };
  }

  /**
   * Vérifie l'éligibilité pour URSSAF (Auto-entrepreneur)
   */
  static checkURSSAF(userData: any): EligibilityResult {
    const missingDocs: string[] = [];

    // Pièce d'identité
    if (!userData.piece_identite && !userData.nom) {
      missingDocs.push("Pièce d'identité");
    }

    // RIB
    if (!userData.rib) {
      missingDocs.push("RIB");
    }

    // Justificatif domicile
    if (!userData.justificatif_domicile && !userData.adresse) {
      missingDocs.push("Justificatif de domicile");
    }

    if (missingDocs.length > 0) {
      return {
        eligible: true,
        reason: "Documents manquants pour immatriculation",
        missingDocuments: missingDocs,
      };
    }

    return { eligible: true };
  }

  /**
   * Fonction principale de vérification d'éligibilité
   */
  static check(
    siteName: "CAF" | "ANTS" | "IMPOTS" | "SECU" | "POLE_EMPLOI" | "PREFECTURE" | "URSSAF",
    userData: any
  ): EligibilityResult {
    switch (siteName) {
    case "CAF":
      return this.checkCAF(userData, userData.typeAide || "");
    case "ANTS":
      return this.checkANTS(userData, userData.typeDocument || "");
    case "IMPOTS":
      return this.checkImpots(userData);
    case "SECU":
      return this.checkSECU(userData);
    case "POLE_EMPLOI":
      return this.checkPoleEmploi(userData);
    case "PREFECTURE":
      return this.checkPrefecture(userData, userData.typeService || "");
    case "URSSAF":
      return this.checkURSSAF(userData);
    default:
      return { eligible: true };
    }
  }
}
