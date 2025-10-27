const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkData() {
  console.log('\n=== Vérification des données Firestore ===\n');
  
  // Vérifier les processus
  const processes = await db.collection('processes').limit(5).get();
  console.log(`📋 Processus trouvés: ${processes.size}`);
  processes.forEach(doc => {
    const data = doc.data();
    console.log(`  - ${doc.id}: userId="${data.userId}" sessionId="${data.sessionId}"`);
  });
  
  // Vérifier les messages
  const messages = await db.collection('chat_messages').limit(5).get();
  console.log(`\n💬 Messages trouvés: ${messages.size}`);
  messages.forEach(doc => {
    const data = doc.data();
    console.log(`  - ${doc.id}: userId="${data.userId}" sessionId="${data.sessionId}"`);
  });
  
  process.exit(0);
}

checkData().catch(console.error);
