const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkProcess() {
  try {
    const doc = await db.collection('processes').doc('VQJmhf5f5o4fiRqwU6KV').get();
    
    if (!doc.exists) {
      console.log('❌ Process not found');
      process.exit(1);
    }
    
    const data = doc.data();
    
    console.log('\n=== PROCESS DATA ===');
    console.log('📋 ID:', doc.id);
    console.log('📊 Status:', data.status);
    console.log('✅ Has steps:', !!data.steps);
    console.log('📝 Steps type:', typeof data.steps);
    console.log('🔢 Steps length:', data.steps ? data.steps.length : 0);
    console.log('📍 CurrentStepIndex:', data.currentStepIndex);
    
    console.log('\n=== ALL FIELDS ===');
    console.log(Object.keys(data));
    
    if (data.steps) {
      console.log('\n=== STEPS DETAIL ===');
      console.log(JSON.stringify(data.steps, null, 2));
    } else {
      console.log('\n❌ NO STEPS FOUND!');
    }
    
    console.log('\n=== FULL PROCESS DATA ===');
    console.log(JSON.stringify(data, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProcess();
