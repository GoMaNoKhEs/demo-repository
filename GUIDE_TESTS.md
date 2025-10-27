# 🧪 Guide de Test - SimplifIA

**⚠️ IMPORTANT:** Ce guide concerne les **tests en local** (développement).  
Pour le **déploiement en PRODUCTION** (Firebase remote), voir `GUIDE_DEPLOIEMENT_PRODUCTION.md`

---

## 🏠 Tests Backend (Local - Développement)

### 1. Compilation TypeScript
```bash
cd simplifia-backend/functions
npm run build
```
**Résultat attendu:** Compilation réussie sans erreurs ✅

### 2. Tests unitaires
```bash
cd simplifia-backend/functions
npm test
```
**Résultat attendu:** 25/25 tests passants ✅

### 3. Démarrage émulateur Firebase (local)

**⚠️ ÉMULATEUR = LOCAL seulement (développement/tests)**

```bash
cd simplifia-backend
firebase emulators:start
```
**Services émulés localement:**
- Firestore: http://localhost:8080
- Functions: http://localhost:5001
- Auth: http://localhost:9099

**🚨 Pour la DÉMO et PRODUCTION:**
- Utiliser Firebase REMOTE (voir GUIDE_DEPLOIEMENT_PRODUCTION.md)
- Déployer avec `firebase deploy`
- URL production: https://votre-projet.web.app

### 4. Test manuel d'un agent

#### Test EligibilityChecker
```bash
cd simplifia-backend/functions
node -e "
const { EligibilityChecker } = require('./lib/utils/eligibility');

// Test APL éligible
console.log('Test APL éligible:');
console.log(EligibilityChecker.check('CAF', {
  typeAide: 'APL',
  revenus: 1500,
  loyer: 600,
  situation: 'locataire'
}));

// Test RSA inéligible (revenus trop élevés)
console.log('\nTest RSA inéligible:');
console.log(EligibilityChecker.check('CAF', {
  typeAide: 'RSA',
  revenus: 800, // > 607€
  situation: 'celibataire'
}));
"
```

#### Test APISimulator avec EligibilityChecker
```bash
# Démarrer émulateur Firebase d'abord
firebase emulators:start

# Dans un autre terminal
curl -X POST http://localhost:5001/your-project/us-central1/testAPISimulator \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "CAF",
    "userData": {
      "typeAide": "APL",
      "revenus": 1500,
      "loyer": 600,
      "nom": "Dupont",
      "prenom": "Marie"
    }
  }'
```

---

## Tests Frontend

### 1. Compilation Vite
```bash
cd frontend
npm run build
```
**Résultat attendu:** Build réussi en ~5s ✅

### 2. Mode développement
```bash
cd frontend
npm run dev
```
**URL:** http://localhost:5173

### 3. Tests unitaires (Vitest)
```bash
cd frontend
npm test
```

### 4. Linting ESLint
```bash
cd frontend
npm run lint
```

---

## Tests d'Intégration E2E

### Scénario 1: Démarche APL (Happy Path)

**Étapes:**
1. Se connecter avec `marie.demo@simplifia.fr`
2. Cliquer "Nouvelle démarche"
3. Chat: "Je veux faire une demande d'APL"
4. Fournir infos:
   - Nom: Dupont
   - Prénom: Marie
   - Revenus: 1500€
   - Loyer: 600€
   - Situation: Locataire
   - RIB: FR76...

**Résultat attendu:**
- ✅ Analyse terminée (Step 0)
- ✅ EligibilityChecker: Éligible
- ✅ Navigator: Mapping + Soumission réussie
- ✅ APISimulator: Numéro de dossier généré (CAF-2025-XXXXXX)
- ✅ Validator: Toutes données valides
- ✅ Process status: completed
- 🎊 Confetti de célébration

**Logs Firestore à vérifier:**
- Collection `processes`: 1 document avec status "completed"
- Collection `activity_logs`: 5+ logs (analyse, mapping, soumission, validation)
- Collection `chat_messages`: historique de conversation

---

### Scénario 2: Démarche RSA (Inéligible)

**Étapes:**
1. Chat: "Je veux faire une demande de RSA"
2. Fournir infos:
   - Revenus: 800€ (> 607€ plafond)

**Résultat attendu:**
- ❌ EligibilityChecker: Inéligible
- ❌ APISimulator retourne: `statut: "error"`, `reason: "Revenus trop élevés (800€) pour le RSA. Plafond: 607€/mois"`
- ⚠️ Notification Snackbar: Message d'inéligibilité
- ❌ Process status: failed

---

### Scénario 3: Validation échouée (Données invalides)

**Étapes:**
1. Chat: "Demande passeport"
2. Fournir infos:
   - Email: "jean.dupontgmail.com" (@ manquant)
   - Téléphone: "123" (pas 10 chiffres)

**Résultat attendu:**
- ⚠️ Validator détecte erreurs:
  - `[critical] email: Format email invalide (@ manquant)`
  - `[critical] telephone: Téléphone doit contenir 10 chiffres`
- ❌ Process status: failed
- 🔔 ValidationModal affichée avec liste d'erreurs

---

## Tests de Performance

### 1. Temps de réponse Orchestrator

**Objectif:** < 10 secondes pour workflow complet

```bash
# Activer logs détaillés
firebase functions:config:set orchestrator.debug=true

# Observer dans Firebase Console
```

**Métriques à vérifier:**
- Step 0 (Analyse): < 1s (déjà fait par ChatAgent)
- Step 1 (Navigator): 2-4s
  - Mapping: < 500ms
  - APISimulator (avec EligibilityChecker): 1-3s
- Step 2 (Validator): 1-2s
- **Total:** 3-7s ✅

### 2. Circuit Breaker

**Test:** Provoquer 5 échecs consécutifs

```javascript
// Forcer erreur dans APISimulator
// Vérifier logs: "🚨 Circuit breaker opened after 5 consecutive failures"
// Prochain appel: "Circuit breaker open until [timestamp]"
```

### 3. Retry Logic

**Test:** Erreur temporaire Vertex AI

```javascript
// Simuler timeout Vertex AI
// Vérifier logs: tentatives 1, 2, 3 avec backoff exponentiel (1s, 2s, 4s)
```

---

## Tests Responsive Mobile

### Breakpoints à tester

1. **Mobile portrait** (320px - 480px)
   - iPhone SE, iPhone 12 mini
   - Navigation: Drawer gauche
   - Chat: Overlay plein écran
   - ProcessTimeline: Scroll vertical

2. **Mobile landscape** (481px - 768px)
   - iPad mini, tablettes
   - Layout: 2 colonnes (chat + timeline)

3. **Tablet** (769px - 1024px)
   - iPad, tablettes Android
   - Layout: 3 colonnes avec panels resizable

4. **Desktop** (> 1024px)
   - Layout complet: Left panel + Center + Right panel

### Tests Touch Gestures

- ✅ Swipe left/right pour naviguer
- ✅ Pull-to-refresh sur ActivityLogList
- ✅ Long press sur message pour copier
- ✅ Pinch to zoom (désactivé pour éviter bugs)

---

## Tests Accessibilité (A11y)

### WCAG 2.1 Level AA

```bash
cd frontend
npm run test:a11y
```

**Points à vérifier:**
- ✅ Contraste couleurs (4.5:1 pour texte normal)
- ✅ Navigation clavier (Tab, Shift+Tab, Enter, Espace)
- ✅ ARIA labels sur tous les boutons
- ✅ Focus visible sur tous les éléments interactifs
- ✅ Lecteur d'écran (VoiceOver, NVDA)

---

## Tests de Charge

### 1. Test Firestore Listeners

**Scénario:** 100 utilisateurs simultanés

```bash
# Utiliser k6 ou Artillery
artillery quick --count 100 --num 10 https://your-app.web.app
```

**Métriques:**
- Latence listeners: < 100ms
- Mémoire: < 50 MB par client
- CPU: < 30% sur frontend

### 2. Test Vertex AI Rate Limits

**Quota Google Cloud:**
- Gemini Flash: 1500 requêtes/min
- Gemini Pro: 360 requêtes/min

**Stratégie:**
- Caching réponses similaires
- Queue avec retry logic
- Fallback si quota dépassé

---

## Checklist Pré-Démo

### Backend ✅
- [ ] Firebase emulators démarrés
- [ ] Collection `processes` vide (clean state)
- [ ] Collection `activity_logs` vide
- [ ] Compte demo `marie.demo@simplifia.fr` créé
- [ ] Vertex AI credentials configurées

### Frontend ✅
- [ ] npm run dev lancé (port 5173)
- [ ] Connexion démo testée
- [ ] Chat fonctionnel (messages s'affichent)
- [ ] ProcessTimeline met à jour en temps réel
- [ ] Tooltips affichent descriptions
- [ ] Snackbar notifications fonctionnent

### Démo ✅
- [ ] Scénario écrit (< 5min)
- [ ] Slides prêtes (6 slides)
- [ ] Données pré-remplies
- [ ] Répétitions faites (10x minimum)
- [ ] Plan B si erreur (offline mode)

---

## Troubleshooting

### Erreur: "Vertex AI quota exceeded"

**Solution:**
```bash
# Vérifier quota dans Google Cloud Console
gcloud alpha billing quotas list --service=aiplatform.googleapis.com

# Temporaire: Augmenter quota
# Permanent: Implémenter caching + queue
```

### Erreur: "Firestore index missing"

**Solution:**
```bash
cd simplifia-backend
firebase deploy --only firestore:indexes
```

### Erreur: "Functions timeout after 60s"

**Solution:**
```javascript
// Dans firebase.json
{
  "functions": {
    "timeoutSeconds": 120,
    "memory": "1GB"
  }
}
```

### Erreur: "Frontend build size too large"

**Solution:**
```bash
# Analyser bundle
npm run build -- --analyze

# Implémenter code splitting
# Voir: vite.config.ts → build.rollupOptions.output.manualChunks
```

---

## Ressources

### Documentation
- [Firebase Docs](https://firebase.google.com/docs)
- [Vertex AI Docs](https://cloud.google.com/vertex-ai/docs)
- [Material-UI Docs](https://mui.com/material-ui/)
- [Framer Motion Docs](https://www.framer.com/motion/)

### Monitoring
- Firebase Console: https://console.firebase.google.com
- Google Cloud Console: https://console.cloud.google.com
- Vertex AI Studio: https://console.cloud.google.com/vertex-ai

### Support
- GitHub Issues: [lien vers repo]
- Documentation interne: voir RAPPORT_FINAL_INTEGRATION.md

---

*Guide créé le 25 octobre 2025*  
*Dernière mise à jour: Après finalisation backend + frontend*
