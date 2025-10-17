# 🚀 SimplifIA Frontend

**Application web de démonstration pour SimplifIA - Agent IA de simplification des démarches administratives**

[![React](https://img.shields.io/badge/React-19.0.0-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/MUI-7.3.4-007FFF?logo=mui)](https://mui.com)
[![Firebase](https://img.shields.io/badge/Firebase-11.1.0-FFCA28?logo=firebase)](https://firebase.google.com)
[![Vite](https://img.shields.io/badge/Vite-7.0.1-646CFF?logo=vite)](https://vitejs.dev)

---

## 📋 Table des Matières

- [Présentation](#-présentation)
- [Technologies](#-technologies)
- [Installation Rapide](#-installation-rapide)
- [Développement](#-développement)
- [Build & Déploiement](#-build--déploiement)
- [Tests](#-tests)
- [Structure du Projet](#-structure-du-projet)
- [Fonctionnalités](#-fonctionnalités)
- [Documentation](#-documentation)
- [Pour les Développeurs Backend](#-pour-les-développeurs-backend)

---

## 🎯 Présentation

SimplifIA Frontend est une application React moderne qui démontre les capacités d'un agent IA pour automatiser les démarches administratives. 

### Caractéristiques Principales

✅ **Dashboard Interactif** - Timeline en temps réel, logs d'activité, chat avec l'agent  
✅ **Mode Démonstration** - Simulation automatique complète d'une demande administrative  
✅ **Statistics & Analytics** - Graphiques interactifs avec Recharts  
✅ **Export PDF** - Rapports professionnels de 5 pages  
✅ **Dark Mode** - Thème clair/sombre avec persistance  
✅ **Responsive** - Mobile-first design (mobile/tablet/desktop)  
✅ **Accessibilité** - WCAG 2.1 AA compliant  
✅ **Tests** - 29 tests unitaires avec Vitest  
✅ **Performance** - Bundle optimisé (535 kB gzipped)  

---

## 🛠️ Technologies

### Core
- **React 19** - UI library avec React Compiler
- **TypeScript** - Type safety strict
- **Vite** - Build tool ultra-rapide
- **Material-UI v6** - Design System Google

### State & Routing
- **Zustand** - State management léger
- **React Router v7** - Navigation SPA
- **Notistack** - Notifications élégantes

### Features Premium
- **Recharts** - Graphiques statistiques
- **jsPDF + html2canvas** - Export PDF
- **Framer Motion** - Animations 60fps
- **react-resizable-panels** - Panels redimensionnables
- **react-confetti** - Easter eggs célébration

### Backend
- **Firebase 11** - Authentication & Firestore
- **Firebase Realtime Database** - Updates en temps réel

### Testing
- **Vitest** - Test runner moderne
- **Testing Library** - Tests composants React
- **jsdom** - DOM simulation

---

## 🚀 Installation Rapide

### Prérequis

- **Node.js** : v18+ (recommandé v20+)
- **npm** : v9+ (ou yarn/pnpm)
- **Git** : Pour cloner le repository

### Première Installation

```bash
# 1. Cloner le repository
git clone https://github.com/GoMaNoKhEs/demo-repository.git
cd demo-repository/frontend

# 2. Installer les dépendances
npm install

# 3. Configurer Firebase (optionnel pour démo)
# Copier le fichier .env.example et ajouter vos credentials Firebase
cp .env.example .env.local
# Éditer .env.local avec vos clés Firebase

# 4. Lancer en développement
npm run dev
```

L'application sera accessible sur **http://localhost:5173**

### Configuration Firebase (Optionnel)

Créer un fichier `.env.local` à la racine de `/frontend` :

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

> **Note** : L'application fonctionne en mode démo avec des données mockées même sans Firebase configuré.

---

## 💻 Développement

### Commandes Disponibles

```bash
# Développement avec hot-reload
npm run dev

# Build de production
npm run build

# Preview du build de production
npm run preview

# Linter (ESLint)
npm run lint

# Tests unitaires
npm run test

# Tests en mode watch
npm run test:watch

# Tests avec UI interactive
npm run test:ui

# Tests avec coverage
npm run test:coverage
```

### Variables d'Environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `VITE_FIREBASE_API_KEY` | Clé API Firebase | Non* |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine d'auth Firebase | Non* |
| `VITE_FIREBASE_PROJECT_ID` | ID du projet Firebase | Non* |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de storage | Non* |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID messaging | Non* |
| `VITE_FIREBASE_APP_ID` | ID de l'app Firebase | Non* |

\* *Non requis car l'app fonctionne en mode démo avec mock data*

### Mode Développement

```bash
npm run dev
```

- Hot Module Replacement (HMR) activé
- Fast Refresh pour React
- Source maps pour debug
- Port par défaut : 5173

---

## 🏗️ Build & Déploiement

### Build de Production

```bash
npm run build
```

Génère le dossier `dist/` avec :
- Code minifié et optimisé
- Tree-shaking automatique
- Code-splitting (lazy loading)
- Compression gzip
- Source maps

### Preview du Build

```bash
npm run preview
```

Teste le build de production localement sur http://localhost:4173

### Déploiement Firebase Hosting (Recommandé)

```bash
# 1. Installer Firebase CLI
npm install -g firebase-tools

# 2. Login Firebase
firebase login

# 3. Initialiser Firebase (si pas déjà fait)
firebase init hosting

# 4. Build + Deploy
npm run build
firebase deploy --only hosting
```

### Déploiement Autres Plateformes

- **Vercel** : `vercel --prod`
- **Netlify** : `netlify deploy --prod --dir=dist`
- **GitHub Pages** : Via GitHub Actions

---

## 🧪 Tests

### Lancer les Tests

```bash
# Run all tests
npm run test

# Watch mode (re-run on changes)
npm run test:watch

# UI mode (interface graphique)
npm run test:ui

# Coverage report
npm run test:coverage
```

### Coverage Actuel

```
Test Files  : 6 passed (6)
Tests       : 29 passed (29)
Success Rate: 100% ✅
Duration    : ~13s
```

### Tests Créés

- **Composants** : AnimatedNumber, StatusBadge, MessageBubble, ThemeToggleButton
- **Hooks** : useMediaQuery, useNotifications
- **Total** : 29 tests unitaires

---

## 📁 Structure du Projet

```
frontend/
├── public/                      # Assets statiques
├── src/
│   ├── components/             # Composants React
│   │   ├── celebration/        # Overlays de célébration
│   │   ├── chat/               # Interface de chat
│   │   ├── common/             # Composants réutilisables
│   │   ├── dashboard/          # Composants du dashboard
│   │   ├── demo/               # Mode démonstration
│   │   ├── layout/             # Layouts de page
│   │   └── onboarding/         # Tour guidé
│   ├── contexts/               # React Contexts
│   ├── hooks/                  # Custom hooks
│   ├── mocks/                  # Données de test
│   ├── pages/                  # Pages de l'app
│   │   ├── DashboardPage.tsx  # Dashboard principal
│   │   ├── HomePage.tsx        # Landing page
│   │   └── LoginPage.tsx       # Page de connexion
│   ├── services/               # Services externes
│   │   ├── firebase.ts         # Config Firebase
│   │   └── realtime.ts         # Realtime subscriptions
│   ├── stores/                 # Zustand stores
│   ├── styles/                 # CSS global
│   ├── tests/                  # Tests unitaires
│   ├── theme/                  # Material-UI theme
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Fonctions utilitaires
│   ├── App.tsx                 # Composant racine
│   └── main.tsx                # Entry point
├── .env.example                # Template variables d'env
├── .eslintrc.cjs               # Config ESLint
├── index.html                  # HTML template
├── package.json                # Dependencies
├── tsconfig.json               # Config TypeScript
├── vite.config.ts              # Config Vite
└── vitest.config.ts            # Config tests
```

---

## ✨ Fonctionnalités

### 1. Dashboard Interactif

- **Timeline Process** : 6 étapes avec statuts en temps réel
- **Panels Redimensionnables** : Timeline | Logs/Stats | Chat
- **Onglets Scrollables** : Journal, Décisions, Statistiques
- **Real-time Updates** : Via Firebase Firestore
- **Responsive** : 3 layouts (mobile/tablet/desktop)

### 2. Mode Démonstration 🎬

**Le highlight pour les présentations !**

- Simulation automatique complète d'une demande
- 24 logs + 18 messages chat + 6 notifications
- Timeline évolutive en temps réel
- Contrôles : Play/Pause/Stop + vitesse (0.5x-3x)
- Parfait pour démontrer les capacités de l'agent

**Comment utiliser :**
1. Aller sur `/dashboard`
2. Cliquer "Mode Démo" (bouton en bas à droite)
3. Cliquer Play et observer !

### 3. Statistics Panel 📊

- **6 cartes métriques** : Temps économisé, erreurs fixées, taux de succès, etc.
- **4 graphiques Recharts** :
  - Bar Chart : Progression par étape
  - Pie Chart : Répartition des tâches
  - Line Chart : Timeline performance
  - Area Chart : Activité dans le temps

### 4. Export PDF 📄

- Rapports professionnels de 5 pages
- Branding SimplifIA avec Google Blue
- Auto-download avec jsPDF
- Contient : Cover, Stats, Timeline, Logs, Recommendations

### 5. Onboarding Interactif 🎓

- 6 étapes guidées au premier lancement
- Spotlight animé sur chaque élément
- Persistance dans localStorage
- Skip à tout moment

### 6. Easter Eggs 🎊

- Celebration avec confetti à la fin d'une mission
- 200 particules colorées
- Message animé + stats cards
- Trigger automatique à 100% de progression

### 7. Dark Mode 🌙

- Toggle desktop + mobile
- Persistance localStorage
- Transitions smooth (0.3s)
- Contraste optimisé WCAG

### 8. Chat Interface 💬

- Messages user/agent/system
- Suggestions rapides
- Timestamps formatés
- Auto-scroll sur nouveaux messages

---

## 📚 Documentation

### Documents Disponibles

| Document | Description |
|----------|-------------|
| `README.md` | Ce fichier (overview général) |
| `BACKEND_INTEGRATION.md` | **Guide pour les devs backend** |
| `ROADMAP_FRONTEND.md` | Roadmap complète des phases |
| `PROJET_COMPLET.md` | Vue d'ensemble finale du projet |
| `PHASE_6_COMPLETE.md` | Résumé Phase 6 (Tests & Optimisation) |
| `MODE_DEMO_FONCTIONNEL.md` | Guide détaillé du mode démo |
| `ACCESSIBILITE.md` | Guide accessibilité WCAG |
| `RESUME_FINAL.md` | Résumé Phase 5 |

### Guides Spécifiques

- **Pour les développeurs backend** : Voir [`BACKEND_INTEGRATION.md`](./BACKEND_INTEGRATION.md)
- **Pour comprendre l'architecture** : Voir [`PROJET_COMPLET.md`](./PROJET_COMPLET.md)
- **Pour les tests** : Voir [`PHASE_6_COMPLETE.md`](./PHASE_6_COMPLETE.md)

---

## 🔗 Pour les Développeurs Backend

**⚠️ Document essentiel** : [`BACKEND_INTEGRATION.md`](./BACKEND_INTEGRATION.md)

Ce document contient :
- ✅ Architecture Firebase requise
- ✅ Structure des données Firestore
- ✅ API contracts (types TypeScript)
- ✅ Real-time subscriptions
- ✅ Schéma de la base de données
- ✅ Exemples de code backend
- ✅ Guide de connexion frontend ↔ backend

**Lecture obligatoire avant de commencer le développement backend !**

---

## 🎨 Design System

### Palette de Couleurs Google

```typescript
Primary Blue:   #1a73e8  // Boutons, liens, highlights
Success Green:  #0f9d58  // Succès, validations
Warning Yellow: #f9ab00  // Alertes, avertissements
Error Red:      #d93025  // Erreurs, actions critiques
```

### Composants Material-UI

- Tous les composants MUI v6
- Thème customisé Google-inspired
- Responsive breakpoints : 600px (tablet), 1024px (desktop)

---

## 🚨 Troubleshooting

### Problèmes Courants

#### `npm install` échoue
```bash
# Nettoyer le cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Port 5173 déjà utilisé
```bash
# Changer le port dans vite.config.ts
export default defineConfig({
  server: { port: 3000 }
})
```

#### Firebase errors en développement
- Vérifier `.env.local` existe et contient les bonnes clés
- Ou désactiver Firebase dans `src/services/firebase.ts` pour mode démo

#### Build size warnings
- Normal ! Bundle optimisé avec code-splitting
- Lazy loading actif sur StatsPanel, Demo, Celebration
- Bundle principal : 535 kB gzipped (acceptable)

---

## 🤝 Contribution

### Workflow Git

```bash
# 1. Créer une branche
git checkout -b feature/ma-feature

# 2. Coder et commit
git add .
git commit -m "feat: ma nouvelle feature"

# 3. Push
git push origin feature/ma-feature

# 4. Créer une Pull Request
```

### Standards de Code

- **TypeScript strict** : Pas de `any`
- **ESLint** : Suivre les règles définies
- **Naming** : camelCase pour variables, PascalCase pour composants
- **Tests** : Ajouter tests pour nouvelles features

---

## 📊 Performance

### Métriques Actuelles

| Métrique | Valeur | Objectif |
|----------|--------|----------|
| Bundle principal | 535 kB (gzipped) | < 600 kB ✅ |
| First Contentful Paint | < 1.5s | < 2s ✅ |
| Time to Interactive | < 3s | < 4s ✅ |
| Lighthouse Performance | 90+ | > 85 ✅ |
| Lighthouse Accessibility | 95+ | > 90 ✅ |

### Optimisations Appliquées

- ✅ Code-splitting avec React.lazy
- ✅ Lazy loading des composants lourds
- ✅ Tree-shaking automatique
- ✅ Compression gzip
- ✅ Image optimization (à améliorer)

---

## 📝 License

Ce projet est développé dans le cadre du **Hackathon Google Cloud 2025**.

---

## 👥 Équipe

- **Frontend Lead** : Esdras Gbedozin
- **Backend** : À compléter
- **UI/UX** : À compléter

---

## 🎯 Roadmap

### Phase 0-6 : ✅ TERMINÉES (100%)

- [x] Setup & Architecture
- [x] Fondations
- [x] Dashboard Core
- [x] Intégration & Contrôles
- [x] Polish & Animations
- [x] Features Premium
- [x] Tests & Optimisation

### Post-Hackathon (Optionnel)

- [ ] Tests E2E avec Playwright
- [ ] CI/CD avec GitHub Actions
- [ ] Monitoring avec Sentry
- [ ] Analytics avec Google Analytics
- [ ] PWA (Service Worker)

---

## 🆘 Support

Pour toute question :

1. Consulter la [documentation](#-documentation)
2. Voir les [issues GitHub](https://github.com/GoMaNoKhEs/demo-repository/issues)
3. Contacter l'équipe frontend

---

**Développé avec ❤️ pour le Hackathon Google Cloud 2025**  
**Powered by Vertex AI Agent Builder** 🚀

import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
