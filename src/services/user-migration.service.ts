import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useUser } from '@clerk/clerk-react';

export interface UserMigrationMapping {
  clerkUserId: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  migrationDate: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface MigrationResult {
  success: boolean;
  message: string;
  migratedCollections?: string[];
  errors?: string[];
}

class UserMigrationService {
  private readonly MIGRATION_COLLECTION = 'user_migrations';
  private readonly USER_DATA_COLLECTIONS = [
    'incomes',
    'expenses', 
    'portfolios',
    'budgets',
    'notes',
    'calendar',
    'cargo',
    'subscriptions',
    'loginRecords'
  ];
  
  private readonly NESTED_USER_COLLECTIONS = [
    'notes',
    'events', 
    'financial',
    'goals',
    'budget',
    'warranties',
    'payments',
    'reminders'
  ];

  /**
   * Kullanıcının email adresine göre Firebase UID'sini bulur
   */
  async findFirebaseUidByEmail(email: string): Promise<string | null> {
    try {
      // Migration mapping'de daha önce eşleştirilmiş kullanıcı var mı kontrol et
      const migrationQuery = query(
        collection(db, this.MIGRATION_COLLECTION),
        where('email', '==', email)
      );
      const migrationSnapshot = await getDocs(migrationQuery);
      
      if (!migrationSnapshot.empty) {
        const migrationData = migrationSnapshot.docs[0].data() as UserMigrationMapping;
        return migrationData.firebaseUid;
      }

      // Login records'da email ile kullanıcı ara
      const loginQuery = query(
        collection(db, 'loginRecords'),
        where('email', '==', email)
      );
      const loginSnapshot = await getDocs(loginQuery);
      
      if (!loginSnapshot.empty) {
        const loginData = loginSnapshot.docs[0].data();
        return loginData.userId;
      }

      // Diğer collection'larda email ile kullanıcı ara
      for (const collectionName of this.USER_DATA_COLLECTIONS) {
        try {
          const userQuery = query(
            collection(db, collectionName),
            where('email', '==', email)
          );
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            if (userData.userId) {
              return userData.userId;
            }
          }
        } catch (error) {
          console.warn(`Error searching in ${collectionName}:`, error);
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding Firebase UID by email:', error);
      return null;
    }
  }

  /**
   * Kullanıcı eşleştirmesi oluşturur
   */
  async createUserMapping(
    clerkUserId: string, 
    firebaseUid: string, 
    email: string, 
    displayName?: string
  ): Promise<boolean> {
    try {
      const mappingData: UserMigrationMapping = {
        clerkUserId,
        firebaseUid,
        email,
        displayName,
        migrationDate: new Date(),
        status: 'pending'
      };

      await setDoc(
        doc(db, this.MIGRATION_COLLECTION, clerkUserId),
        mappingData
      );

      return true;
    } catch (error) {
      console.error('Error creating user mapping:', error);
      return false;
    }
  }

  /**
   * Kullanıcının verilerini Firebase UID'den Clerk ID'ye migrate eder
   */
  async migrateUserData(clerkUserId: string, firebaseUid: string): Promise<MigrationResult> {
    const migratedCollections: string[] = [];
    const errors: string[] = [];
    
    try {
      const batch = writeBatch(db);
      let batchCount = 0;
      const BATCH_LIMIT = 500;

      // Ana collection'ları migrate et
      for (const collectionName of this.USER_DATA_COLLECTIONS) {
        try {
          const userQuery = query(
            collection(db, collectionName),
            where('userId', '==', firebaseUid)
          );
          const snapshot = await getDocs(userQuery);
          
          if (!snapshot.empty) {
            for (const docSnapshot of snapshot.docs) {
              const data = docSnapshot.data();
              data.userId = clerkUserId;
              data.migratedAt = new Date();
              data.originalFirebaseUid = firebaseUid;
              
              batch.update(docSnapshot.ref, data);
              batchCount++;
              
              if (batchCount >= BATCH_LIMIT) {
                await batch.commit();
                batchCount = 0;
              }
            }
            migratedCollections.push(collectionName);
          }
        } catch (error) {
          errors.push(`Error migrating ${collectionName}: ${error}`);
        }
      }

      // Nested collection'ları migrate et (teknokapsul/{userId}/...)
      for (const collectionName of this.NESTED_USER_COLLECTIONS) {
        try {
          const nestedCollectionRef = collection(db, 'teknokapsul', firebaseUid, collectionName);
          const snapshot = await getDocs(nestedCollectionRef);
          
          if (!snapshot.empty) {
            for (const docSnapshot of snapshot.docs) {
              const data = docSnapshot.data();
              data.migratedAt = new Date();
              data.originalFirebaseUid = firebaseUid;
              
              // Yeni Clerk ID ile yeni document oluştur
              const newDocRef = doc(db, 'teknokapsul', clerkUserId, collectionName, docSnapshot.id);
              batch.set(newDocRef, data);
              
              // Eski document'i sil
              batch.delete(docSnapshot.ref);
              batchCount += 2;
              
              if (batchCount >= BATCH_LIMIT) {
                await batch.commit();
                batchCount = 0;
              }
            }
            migratedCollections.push(`teknokapsul/${collectionName}`);
          }
        } catch (error) {
          errors.push(`Error migrating nested ${collectionName}: ${error}`);
        }
      }

      // Son batch'i commit et
      if (batchCount > 0) {
        await batch.commit();
      }

      // Migration status'u güncelle
      await updateDoc(
        doc(db, this.MIGRATION_COLLECTION, clerkUserId),
        {
          status: errors.length === 0 ? 'completed' : 'failed',
          migratedCollections,
          errors,
          completedAt: new Date()
        }
      );

      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `${migratedCollections.length} collection başarıyla migrate edildi`
          : `Migration tamamlandı ancak ${errors.length} hata oluştu`,
        migratedCollections,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Error during migration:', error);
      return {
        success: false,
        message: `Migration sırasında hata oluştu: ${error}`,
        errors: [error as string]
      };
    }
  }

  /**
   * Otomatik migration - Clerk kullanıcısı için Firebase verilerini arar ve migrate eder
   */
  async autoMigrateUser(clerkUserId: string, email: string, displayName?: string): Promise<MigrationResult> {
    try {
      // Daha önce migration yapılmış mı kontrol et
      const existingMapping = await getDoc(doc(db, this.MIGRATION_COLLECTION, clerkUserId));
      if (existingMapping.exists() && existingMapping.data().status === 'completed') {
        return {
          success: true,
          message: 'Kullanıcı verileri daha önce migrate edilmiş'
        };
      }

      // Firebase UID'sini bul
      const firebaseUid = await this.findFirebaseUidByEmail(email);
      if (!firebaseUid) {
        return {
          success: false,
          message: 'Bu email adresi ile Firebase\'de kullanıcı verisi bulunamadı'
        };
      }

      // Mapping oluştur
      const mappingCreated = await this.createUserMapping(clerkUserId, firebaseUid, email, displayName);
      if (!mappingCreated) {
        return {
          success: false,
          message: 'Kullanıcı eşleştirmesi oluşturulamadı'
        };
      }

      // Verileri migrate et
      return await this.migrateUserData(clerkUserId, firebaseUid);
    } catch (error) {
      console.error('Error in auto migration:', error);
      return {
        success: false,
        message: `Otomatik migration sırasında hata oluştu: ${error}`
      };
    }
  }

  /**
   * UID ile manuel migration - Kullanıcı Firebase UID'sini biliyorsa direkt migration yapar
   */
  async migrateUserByUid(clerkUserId: string, firebaseUid: string, email: string, displayName?: string): Promise<MigrationResult> {
    try {
      // Daha önce migration yapılmış mı kontrol et
      const existingMapping = await getDoc(doc(db, this.MIGRATION_COLLECTION, clerkUserId));
      if (existingMapping.exists() && existingMapping.data().status === 'completed') {
        return {
          success: true,
          message: 'Kullanıcı verileri daha önce migrate edilmiş'
        };
      }

      // Firebase UID'sinin geçerli olup olmadığını kontrol et
      const hasData = await this.checkFirebaseUidHasData(firebaseUid);
      if (!hasData) {
        return {
          success: false,
          message: 'Bu Firebase UID ile kullanıcı verisi bulunamadı'
        };
      }

      // Mapping oluştur
      const mappingCreated = await this.createUserMapping(clerkUserId, firebaseUid, email, displayName);
      if (!mappingCreated) {
        return {
          success: false,
          message: 'Kullanıcı eşleştirmesi oluşturulamadı'
        };
      }

      // Verileri migrate et
      return await this.migrateUserData(clerkUserId, firebaseUid);
    } catch (error) {
      console.error('Error in UID migration:', error);
      return {
        success: false,
        message: `UID migration sırasında hata oluştu: ${error}`
      };
    }
  }

  /**
   * Firebase UID'sinin veri içerip içermediğini kontrol eder
   */
  private async checkFirebaseUidHasData(firebaseUid: string): Promise<boolean> {
    try {
      for (const collectionName of this.USER_DATA_COLLECTIONS) {
        const userQuery = query(
          collection(db, collectionName),
          where('userId', '==', firebaseUid)
        );
        const snapshot = await getDocs(userQuery);
        if (!snapshot.empty) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking Firebase UID data:', error);
      return false;
    }
  }

  /**
   * Migration durumunu kontrol eder
   */
  async getMigrationStatus(clerkUserId: string): Promise<UserMigrationMapping | null> {
    try {
      const mappingDoc = await getDoc(doc(db, this.MIGRATION_COLLECTION, clerkUserId));
      if (mappingDoc.exists()) {
        return mappingDoc.data() as UserMigrationMapping;
      }
      return null;
    } catch (error) {
      console.error('Error getting migration status:', error);
      return null;
    }
  }

  /**
   * Tüm kullanıcılar için migration durumunu listeler (admin)
   */
  async getAllMigrations(): Promise<UserMigrationMapping[]> {
    try {
      const snapshot = await getDocs(collection(db, this.MIGRATION_COLLECTION));
      return snapshot.docs.map(doc => (doc.data() as UserMigrationMapping));
    } catch (error) {
      console.error('Error getting all migrations:', error);
      return [];
    }
  }
}

export const userMigrationService = new UserMigrationService();

/**
 * React Hook - Kullanıcı giriş yaptığında otomatik migration kontrolü yapar
 */
export const useAutoMigration = () => {
  const { user, isLoaded } = useUser();

  const checkAndMigrate = async () => {
    if (!isLoaded || !user) return null;

    try {
      const result = await userMigrationService.autoMigrateUser(
        user.id,
        user.primaryEmailAddress?.emailAddress || '',
        user.fullName || undefined
      );
      
      if (result.success) {
        console.log('Migration başarılı:', result.message);
      } else {
        console.warn('Migration başarısız:', result.message);
      }
      
      return result;
    } catch (error) {
      console.error('Auto migration error:', error);
      return null;
    }
  };

  return { checkAndMigrate };
};