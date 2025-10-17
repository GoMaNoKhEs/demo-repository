#!/usr/bin/env node

/**
 * Script de réinitialisation SimplifIA
 * 
 * Ce script ouvre automatiquement le navigateur sur la page de réinitialisation
 * pour supprimer le localStorage et réactiver l'onboarding.
 * 
 * Usage:
 *   npm run reset
 *   ou
 *   node scripts/reset.js
 */

import { exec } from 'child_process';
import os from 'os';

console.log('\n🔄 SimplifIA - Script de Réinitialisation\n');
console.log('================================================\n');

const platform = os.platform();
const resetUrl = 'http://localhost:5173/reset.html';

console.log('📋 Ce script va :');
console.log('  ✓ Ouvrir la page de réinitialisation');
console.log('  ✓ Vous permettre de supprimer le localStorage');
console.log('  ✓ Réactiver le tour d\'onboarding\n');

console.log(`🌐 Ouverture de : ${resetUrl}\n`);

// Déterminer la commande d'ouverture selon l'OS
let command;

if (platform === 'darwin') {
  // macOS
  command = `open ${resetUrl}`;
} else if (platform === 'win32') {
  // Windows
  command = `start ${resetUrl}`;
} else {
  // Linux
  command = `xdg-open ${resetUrl}`;
}

// Exécuter la commande
exec(command, (error) => {
  if (error) {
    console.error('❌ Erreur lors de l\'ouverture du navigateur:');
    console.error(`   ${error.message}\n`);
    console.log('💡 Solution alternative :');
    console.log(`   Ouvrez manuellement : ${resetUrl}\n`);
    process.exit(1);
  }
  
  console.log('✅ Navigateur ouvert avec succès !');
  console.log('\n📝 Instructions :');
  console.log('  1. Cliquez sur "Réinitialiser l\'application"');
  console.log('  2. Confirmez l\'action');
  console.log('  3. L\'application sera rechargée automatiquement');
  console.log('  4. Le tour d\'onboarding apparaîtra au prochain chargement\n');
  console.log('================================================\n');
});

// Alternative : Instructions manuelles via console
console.log('💡 Alternative manuelle (si le navigateur ne s\'ouvre pas) :');
console.log('   Ouvrez la console du navigateur (F12) et exécutez :');
console.log('   localStorage.removeItem(\'hasSeenOnboarding\');');
console.log('   location.reload();\n');
