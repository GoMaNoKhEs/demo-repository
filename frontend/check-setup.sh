#!/bin/bash

# 🔍 Script de vérification rapide - SimplifIA Frontend
# Usage: ./check-setup.sh

echo "🔍 Vérification de la configuration SimplifIA Frontend..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
ERRORS=0
WARNINGS=0

# 1. Vérifier que nous sommes dans le bon dossier
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json introuvable${NC}"
    echo "   Assurez-vous d'être dans le dossier frontend/"
    exit 1
fi

echo -e "${GREEN}✅ Dossier frontend détecté${NC}"

# 2. Vérifier node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules manquant${NC}"
    echo "   Exécutez: npm install"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ node_modules présent${NC}"
fi

# 3. Vérifier .env.local
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local manquant${NC}"
    echo "   Copiez .env.example et remplissez vos credentials Firebase"
    ERRORS=$((ERRORS + 1))
else
    # Vérifier si les valeurs sont remplies
    if grep -q "your_api_key" .env.local; then
        echo -e "${YELLOW}⚠️  .env.local contient encore des valeurs par défaut${NC}"
        echo "   Remplacez-les par vos vraies credentials Firebase"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✅ .env.local configuré${NC}"
    fi
fi

# 4. Vérifier les fichiers sources essentiels
REQUIRED_FILES=(
    "src/App.tsx"
    "src/main.tsx"
    "src/config/firebase.ts"
    "src/stores/useAppStore.ts"
    "src/types/index.ts"
    "src/theme/index.ts"
    "src/pages/HomePage.tsx"
    "src/pages/LoginPage.tsx"
    "src/pages/DashboardPage.tsx"
    "src/components/chat/ChatInterface.tsx"
    "src/components/chat/MessageBubble.tsx"
    "src/components/layout/MainLayout.tsx"
    "src/components/dashboard/DashboardHeader.tsx"
    "src/components/common/Button.tsx"
    "src/components/common/Card.tsx"
    "src/components/common/StatusBadge.tsx"
    "src/services/realtime.ts"
    "src/mocks/data.ts"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Fichier manquant: $file${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les fichiers sources présents (${#REQUIRED_FILES[@]}/18)${NC}"
fi

# 5. Vérifier la structure des dossiers
REQUIRED_DIRS=(
    "src/components/common"
    "src/components/chat"
    "src/components/layout"
    "src/components/dashboard"
    "src/config"
    "src/services"
    "src/stores"
    "src/types"
    "src/theme"
    "src/pages"
    "src/mocks"
)

MISSING_DIRS=0
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "${RED}❌ Dossier manquant: $dir${NC}"
        MISSING_DIRS=$((MISSING_DIRS + 1))
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $MISSING_DIRS -eq 0 ]; then
    echo -e "${GREEN}✅ Structure de dossiers complète${NC}"
fi

# 6. Vérifier les dépendances critiques dans package.json
CRITICAL_DEPS=("react" "react-dom" "@mui/material" "firebase" "zustand" "framer-motion")
for dep in "${CRITICAL_DEPS[@]}"; do
    if ! grep -q "\"$dep\"" package.json; then
        echo -e "${RED}❌ Dépendance manquante: $dep${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

echo -e "${GREEN}✅ Dépendances critiques présentes dans package.json${NC}"

# Résumé
echo ""
echo "=========================================="
echo "📊 Résumé de la vérification"
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Tout est OK ! Vous êtes prêt à coder !${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "  1. Si pas encore fait: npm install"
    echo "  2. Si .env.local pas configuré: Remplir les credentials Firebase"
    echo "  3. Lancer le dev server: npm run dev"
    echo "  4. Ouvrir http://localhost:5173"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} avertissement(s)${NC}"
    echo "Vous pouvez continuer mais vérifiez les avertissements ci-dessus"
else
    echo -e "${RED}❌ ${ERRORS} erreur(s) trouvée(s)${NC}"
    [ $WARNINGS -gt 0 ] && echo -e "${YELLOW}⚠️  ${WARNINGS} avertissement(s)${NC}"
    echo ""
    echo "Corrigez les erreurs avant de continuer"
    exit 1
fi

echo ""
