import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Application } from '../types/application';

class ApplicationService {
  // Generate unique application number
  private generateApplicationNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TK${timestamp}${random}`;
  }

  // Create new application
  async createApplication(
    userId: string, 
    applicationData: Omit<Application, 'id' | 'applicationNumber' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const now = new Date();
      const applicationNumber = this.generateApplicationNumber();
      
      const newApplication = {
        ...applicationData,
        userId,
        applicationNumber,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };

      const docRef = await addDoc(
        collection(db, 'teknokapsul', userId, 'applications'), 
        newApplication
      );
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  }

  // Get user applications
  async getUserApplications(userId: string): Promise<Application[]> {
    try {
      const q = query(
        collection(db, 'teknokapsul', userId, 'applications'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate() || undefined
      })) as Application[];
    } catch (error) {
      console.error('Error getting user applications:', error);
      throw error;
    }
  }

  // Get application by number
  async getApplicationByNumber(userId: string, applicationNumber: string): Promise<Application | null> {
    try {
      const q = query(
        collection(db, 'teknokapsul', userId, 'applications'),
        where('applicationNumber', '==', applicationNumber)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate() || undefined
      } as Application;
    } catch (error) {
      console.error('Error getting application by number:', error);
      throw error;
    }
  }

  // Update application status
  async updateApplicationStatus(
    userId: string, 
    applicationId: string, 
    status: Application['status'],
    notes?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      if (notes) {
        updateData.notes = notes;
      }
      
      if (status === 'completed') {
        updateData.completedAt = Timestamp.fromDate(new Date());
      }
      
      const docRef = doc(db, 'teknokapsul', userId, 'applications', applicationId);
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }

  // Delete application
  async deleteApplication(userId: string, applicationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'teknokapsul', userId, 'applications', applicationId));
    } catch (error) {
      console.error('Error deleting application:', error);
      throw error;
    }
  }

  // Get pending applications count
  async getPendingApplicationsCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'teknokapsul', userId, 'applications'),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting pending applications count:', error);
      return 0;
    }
  }
}

export const applicationService = new ApplicationService();
export default applicationService;