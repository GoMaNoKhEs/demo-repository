#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║            �� TEST DE RÉINITIALISATION                    ║"
echo "║                    SimplifIA                               ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Ce script va :"
echo "  1. Vérifier que l'app est lancée"
echo "  2. Ouvrir la page de réinitialisation"
echo "  3. Vous guider pour réactiver l'onboarding"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier si l'app tourne sur le port 5173
if ! lsof -i :5173 > /dev/null 2>&1; then
    echo "❌ L'application ne semble pas être lancée sur le port 5173"
    echo ""
    echo "💡 Solution :"
    echo "   Ouvrez un autre terminal et lancez :"
    echo "   cd frontend && npm run dev"
    echo ""
    echo "   Puis relancez ce script."
    exit 1
fi

echo "✅ Application détectée sur le port 5173"
echo ""

# Ouvrir le navigateur
echo "🌐 Ouverture du navigateur..."
open http://localhost:5173/reset.html

echo ""
echo "📝 Instructions :"
echo ""
echo "  1. ✅ Le navigateur vient de s'ouvrir sur la page de reset"
echo "  2. 🖱️  Cliquez sur le bouton 'Réinitialiser l'application'"
echo "  3. ✔️  Confirmez l'action dans la popup"
echo "  4. ⏳ L'app se recharge automatiquement"
echo "  5. 🎯 Allez sur http://localhost:5173/dashboard"
echo "  6. ⏱️  Attendez 1 seconde"
echo "  7. �� L'onboarding apparaît !"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Alternative rapide (console navigateur) :"
echo ""
echo "   1. Ouvrez la console (F12)"
echo "   2. Collez :"
echo "      localStorage.clear(); location.reload();"
echo "   3. Appuyez sur Entrée"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Script terminé !"
echo ""
