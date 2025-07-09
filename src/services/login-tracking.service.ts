import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';

interface LoginRecord {
  userId: string;
  timestamp: any;
  ipAddress: string;
  userAgent: string;
  device: string;
  location?: string;
  loginMethod: 'email' | 'google' | 'phone';
  success: boolean;
}

class LoginTrackingService {
  private async getClientInfo() {
    const userAgent = navigator.userAgent;
    let device = 'Desktop';
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      device = 'Mobile';
    } else if (/Tablet|iPad/.test(userAgent)) {
      device = 'Tablet';
    }

    // Get IP address (this would need a service like ipapi.co in production)
    let ipAddress = 'Unknown';
    let location = undefined;
    
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      ipAddress = data.ip || 'Unknown';
      location = `${data.city}, ${data.country_name}` || undefined;
    } catch (error) {
      console.log('Could not fetch IP info:', error);
    }

    return {
      userAgent,
      device,
      ipAddress,
      location
    };
  }

  async recordLogin(loginMethod: 'email' | 'google' | 'phone', success: boolean = true) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const clientInfo = await this.getClientInfo();
      
      const loginRecord: LoginRecord = {
        userId: user.uid,
        timestamp: serverTimestamp(),
        loginMethod,
        success,
        ...clientInfo
      };

      // Create a new document with auto-generated ID
      const docRef = doc(collection(db, 'teknokapsul', user.uid, 'loginRecords'));
      await setDoc(docRef, loginRecord);
      
      console.log('Login recorded successfully');
    } catch (error) {
      console.error('Error recording login:', error);
    }
  }

  async recordFailedLogin(email: string, loginMethod: 'email' | 'google' | 'phone') {
    try {
      const clientInfo = await this.getClientInfo();
      
      const loginRecord = {
        email, // Store email for failed attempts
        timestamp: serverTimestamp(),
        loginMethod,
        success: false,
        ...clientInfo
      };

      const docRef = doc(collection(db, 'teknokapsul', 'system', 'failedLoginAttempts'));
      await setDoc(docRef, loginRecord);
      
      console.log('Failed login recorded successfully');
    } catch (error) {
      console.error('Error recording failed login:', error);
    }
  }

  // Record logout
  async recordLogout() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const clientInfo = await this.getClientInfo();
      
      const logoutRecord = {
        userId: user.uid,
        timestamp: serverTimestamp(),
        action: 'logout',
        ...clientInfo
      };

      const docRef = doc(collection(db, 'teknokapsul', user.uid, 'loginRecords'));
      await setDoc(docRef, logoutRecord);
      
      console.log('Logout recorded successfully');
    } catch (error) {
      console.error('Error recording logout:', error);
    }
  }
}

export const loginTrackingService = new LoginTrackingService();