const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// 1. Point to the service account JSON file you downloaded
const serviceAccount = require('./service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

async function makeAdmin() {
  // 2. Replace this with your actual Firebase User UID 
  // (You can find it in the Firebase Console -> Authentication)
  const uid = '2uTAYhjHpIcBSjNraLLVFoDyEzy1';
  
  try {
    await getAuth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Successfully made user ${uid} an admin!`);
  } catch (error) {
    console.error("❌ Error setting custom claims:", error);
  }
}

makeAdmin();
