# SimplifIA - L'Agent d'Autonomie Administrative

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

## 🚀 Vue d'ensemble

**SimplifIA** est un agent d'Intelligence Artificielle agentique conçu pour **mettre fin à la surcharge administrative** et à l'exclusion numérique en transformant le labyrinthe administratif en un service simple et conversationnel.

Notre solution passe de l'information statique à **l'action proactive et autonome**, en se concentrant sur une IA éthique et transparente.

### 🎯 Public cible

- **Personnes en difficulté cognitive** : Pour lesquelles la navigation en ligne est une barrière invisible
- **Professionnels et individus pressés** : Qui cherchent à récupérer le temps perdu dans les démarches complexes

---

## ✨ Fonctionnalités Clés

### 1. 🧠 Orchestration Proactive Multi-Organismes

L'agent utilise **Vertex AI** pour analyser la requête de l'utilisateur et décide immédiatement de la séquence optimale de 15 à 20 démarches à enclencher, en respectant l'ordre de priorité légale et les délais critiques.

### 2. 🤖 RPA Conversationnel et Auto-Correction

L'agent exécute les actions en utilisant son **Outil d'Interaction Web** pour naviguer, remplir les formulaires et télécharger les pièces justificatives. En cas d'erreur, il décide lui-même de l'action corrective à mener.

### 3. 📊 Tableau de Bord de Confiance

Centre du contrôle utilisateur qui journalise chaque action de l'agent avec validation visuelle et transparence totale.

### 4. ⚖️ Points de Contrôle Éthique

L'agent s'arrête aux étapes nécessitant une décision éthique ou irréversible, permettant la reprise manuelle à tout moment.

### 5. 🔒 Gestion Sécurisée des Données

Stockage exclusif en Europe via GCP, conformité RGPD, et accès sécurisé via Cloud Secret Manager.

---

## 🏗️ Architecture Technique

### Stack Frontend

- **Framework** : React 18 + TypeScript
- **Build Tool** : Vite
- **UI Library** : Material UI (MUI)
- **State Management** : Zustand + React Query
- **Hosting** : Firebase Hosting

### Stack Backend

- **Cloud Platform** : Google Cloud Platform (GCP)
- **AI/ML** : Vertex AI
- **Database** : Cloud Firestore
- **Functions** : Cloud Functions
- **Security** : Cloud Secret Manager
- **Region** : Europe (France/UE) pour la souveraineté des données

```
┌─────────────────────────────────────────────────┐
│         Firebase Hosting (Frontend)             │
│      React + TypeScript + Material UI          │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│           Google Cloud Platform                 │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Vertex   │  │  Cloud   │  │  Cloud   │     │
│  │   AI     │  │Firestore │  │ Secret   │     │
│  │          │  │          │  │ Manager  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                  │
│  ┌──────────────────────────────────────┐      │
│  │      Cloud Functions (RPA)           │      │
│  └──────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

---

## 📁 Structure du Projet

```
SimplifIA/
├── frontend/              # Application React
│   ├── src/
│   │   ├── components/   # Composants UI
│   │   ├── config/       # Configuration Firebase
│   │   ├── services/     # Services (API, temps réel)
│   │   └── utils/        # Utilitaires
│   └── public/
├── functions/            # Cloud Functions
│   └── api_trigger_agent/
├── agent/                # Configuration Vertex AI
├── docs/                 # Documentation
│   ├── SimplifIA.md
│   ├── Scenario_Demo.md
│   ├── Stack_Frontend_SimplifIA.md
│   └── PlanningDetaillé.md
└── cloudbuild.yaml       # Configuration CI/CD
```

---

## 🚦 Démarrage Rapide

### Prérequis

- Node.js 20+
- npm ou pnpm
- Compte Google Cloud Platform
- Firebase CLI

### Installation Frontend

```bash
cd frontend
npm install
npm run dev
```

### Configuration GCP

1. Créer un projet GCP dans une région européenne
2. Activer les APIs : Vertex AI, Firestore, Cloud Functions, Secret Manager
3. Configurer Firebase Hosting
4. Déployer les Cloud Functions

---

## 📚 Documentation

### Documents Stratégiques
- [**SimplifIA.md**](./SimplifIA.md) - Présentation complète du projet
- [**Scenario_Demo.md**](./Scenario_Demo.md) - Scénario de démonstration
- [**PlanningDetaillé.md**](./PlanningDetaillé.md) - Planning général du hackathon

### Documentation Technique Frontend
- [**ROADMAP_FRONTEND.md**](./ROADMAP_FRONTEND.md) - 🚀 **Roadmap détaillée pour les 2 développeurs frontend**
- [**Stack_Frontend_SimplifIA.md**](./Stack_Frontend_SimplifIA.md) - Stack technique complète
- [**CODE_SNIPPETS.md**](./CODE_SNIPPETS.md) - Snippets de code prêts à l'emploi

---

## 🎯 Différenciation

### SimplifIA vs Solutions Actuelles

| Aspect | Solutions Actuelles | SimplifIA |
|--------|---------------------|-----------|
| Type | Chatbot informationnel | Agent autonome |
| Action | Réactive | Proactive |
| Erreurs | Bloque l'utilisateur | Auto-correction |
| Transparence | Limitée | Totale (Tableau de Bord) |
| Contrôle | Faible | Fort (points de contrôle) |

---

## 💼 Modèle Économique

**Modèle B2B2C** : Notre solution sera financée par des assurances, mutuelles ou banques désireuses d'offrir ce service premium à leurs clients lors d'événements de vie critiques (naissance, déménagement, décès, etc.).

---

## 🔐 Sécurité et Conformité

- ✅ Stockage des données exclusivement en Europe (France/UE)
- ✅ Conformité RGPD
- ✅ Chiffrement end-to-end
- ✅ Authentification multi-facteurs
- ✅ Audit trail complet

---

## 👥 Équipe

- **D1** : Lead Technique / DevOps
- **D2** : Développeur Frontend / UX
- **D3** : Développeur Backend / APIs
- **A1** : Architecte IA / Agentique
- **P1** : Pitch & Contenu

---

## 📈 Roadmap

- [x] Phase 1: Structuration et Fondations (J1-J3)
- [x] Phase 2: Cœur Agentique (J4-J8)
- [ ] Phase 3: Finalisation et Pitch (J9-J13)

---

## 🤝 Contribution

Ce projet est développé dans le cadre d'un hackathon Google Agentic AI.

---

## 📄 License

MIT License - voir [LICENSE](LICENSE) pour plus de détails.

---

## 🌟 Pourquoi SimplifIA ?

> "SimplifIA n'est pas un simple chatbot ou un RPA rigide. C'est un agent autonome qui raisonne, planifie, agit et se corrige."

**Impact :** Mettre fin à l'exclusion numérique et redonner du temps aux citoyens pour ce qui compte vraiment.

---

**Développé avec ❤️ par l'équipe SimplifIA**

