// Cloud Function (functions/index.js)
exports.getClientIP = functions.https.onCall((data, context) => {
    const ip = context.rawRequest.ip;
    // หรือใช้ headers อื่นๆ เพิ่มเติม
    const forwardedFor = context.rawRequest.headers['x-forwarded-for'];
    const realIP = context.rawRequest.headers['x-real-ip'];
    
    return {
      ip: ip,
      forwardedFor: forwardedFor,
      realIP: realIP
    };
  });
  
  // ในไฟล์ admin-logs.html ปรับฟังก์ชัน createLog:
  async function createLog(actionType, details) {
      try {
          if (!currentUser) return;
  
          const userDoc = await firebase.firestore()
              .collection('users')
              .doc(currentUser.uid)
              .get();
  
          const userData = userDoc.data();
          
          // เรียกใช้ Cloud Function เพื่อดึง IP
          const getIP = firebase.functions().httpsCallable('getClientIP');
          const ipResult = await getIP();
          
          const logEntry = {
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              userEmail: currentUser.email,
              userName: userData?.displayName,
              userId: currentUser.uid,
              actionType,
              details,
              ipAddress: ipResult.data.ip || ipResult.data.realIP || ipResult.data.forwardedFor || 'Unknown'
          };
  
          await firebase.firestore().collection('logs').add(logEntry);
          
          // Reload logs after creating new entry
          loadLogs();
      } catch (error) {
          console.error('Error creating log:', error);
          // ยังคงสร้าง log แม้จะไม่สามารถดึง IP ได้
          const logEntry = {
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              userEmail: currentUser.email,
              userName: userData?.displayName,
              userId: currentUser.uid,
              actionType,
              details,
              ipAddress: 'Unable to detect'
          };
          
          await firebase.firestore().collection('logs').add(logEntry);
          loadLogs();
      }
  }