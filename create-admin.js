const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('./service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

async function createAdmin() {
  const email = "404dsatracker@gmail.com";
  const password = "dsa404@18";
  
  try {
    // 1. Try to see if the user exists
    let userRecord;
    try {
      userRecord = await getAuth().getUserByEmail(email);
      console.log(`User ${email} already exists with UID: ${userRecord.uid}`);
      
      // Update password just in case
      await getAuth().updateUser(userRecord.uid, { password: password });
      console.log(`Password updated to dsa404@18`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // 2. Create the user if it doesn't exist
        console.log(`Creating new user ${email}...`);
        userRecord = await getAuth().createUser({
          email: email,
          password: password,
          displayName: "Super Admin",
        });
        console.log(`Created new user with UID: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    // 3. Set the admin claim
    await getAuth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log(`✅ Successfully granted admin privileges to ${email}!`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

createAdmin();
