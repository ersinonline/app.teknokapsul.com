import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface SavedAddress {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode?: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  savedAddresses: SavedAddress[];
  defaultAddressId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Kullanıcı profilini getir
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        savedAddresses: data.savedAddresses?.map((addr: any) => ({
          ...addr,
          createdAt: addr.createdAt?.toDate() || new Date(),
          updatedAt: addr.updatedAt?.toDate() || new Date()
        })) || []
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Kullanıcı profili getirilemedi:', error);
    throw error;
  }
};

// Kullanıcı profilini oluştur veya güncelle
export const createOrUpdateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const existingUser = await getDoc(userRef);
    
    if (existingUser.exists()) {
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: new Date()
      });
    } else {
      await setDoc(userRef, {
        uid: userId,
        savedAddresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...profileData
      });
    }
  } catch (error) {
    console.error('Kullanıcı profili güncellenemedi:', error);
    throw error;
  }
};

// Adres kaydet
export const saveAddress = async (userId: string, address: Omit<SavedAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const userProfile = await getUserProfile(userId);
    const addressId = `addr_${Date.now()}`;
    
    const newAddress: SavedAddress = {
      ...address,
      id: addressId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedAddresses = userProfile?.savedAddresses || [];
    
    // Eğer bu ilk adres ise veya default olarak işaretlenmişse
    if (address.isDefault || savedAddresses.length === 0) {
      // Diğer adreslerin default'unu kaldır
      savedAddresses.forEach(addr => addr.isDefault = false);
      newAddress.isDefault = true;
    }
    
    savedAddresses.push(newAddress);

    await createOrUpdateUserProfile(userId, {
      savedAddresses,
      defaultAddressId: newAddress.isDefault ? addressId : userProfile?.defaultAddressId
    });

    return addressId;
  } catch (error) {
    console.error('Adres kaydedilemedi:', error);
    throw error;
  }
};

// Kayıtlı adresleri getir
export const getSavedAddresses = async (userId: string): Promise<SavedAddress[]> => {
  try {
    const userProfile = await getUserProfile(userId);
    return userProfile?.savedAddresses || [];
  } catch (error) {
    console.error('Kayıtlı adresler getirilemedi:', error);
    throw error;
  }
};

// Default adresi getir
export const getDefaultAddress = async (userId: string): Promise<SavedAddress | null> => {
  try {
    const addresses = await getSavedAddresses(userId);
    return addresses.find(addr => addr.isDefault) || null;
  } catch (error) {
    console.error('Default adres getirilemedi:', error);
    throw error;
  }
};

// Adresi güncelle
export const updateAddress = async (userId: string, addressId: string, updates: Partial<SavedAddress>): Promise<void> => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) throw new Error('Kullanıcı profili bulunamadı');

    const addressIndex = userProfile.savedAddresses.findIndex(addr => addr.id === addressId);
    if (addressIndex === -1) throw new Error('Adres bulunamadı');

    // Eğer bu adres default yapılıyorsa, diğerlerinin default'unu kaldır
    if (updates.isDefault) {
      userProfile.savedAddresses.forEach(addr => addr.isDefault = false);
    }

    userProfile.savedAddresses[addressIndex] = {
      ...userProfile.savedAddresses[addressIndex],
      ...updates,
      updatedAt: new Date()
    };

    await createOrUpdateUserProfile(userId, {
      savedAddresses: userProfile.savedAddresses,
      defaultAddressId: updates.isDefault ? addressId : userProfile.defaultAddressId
    });
  } catch (error) {
    console.error('Adres güncellenemedi:', error);
    throw error;
  }
};

// Adresi sil
export const deleteAddress = async (userId: string, addressId: string): Promise<void> => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) throw new Error('Kullanıcı profili bulunamadı');

    const filteredAddresses = userProfile.savedAddresses.filter(addr => addr.id !== addressId);
    
    // Eğer silinen adres default ise ve başka adres varsa, ilkini default yap
    let newDefaultId = userProfile.defaultAddressId;
    if (userProfile.defaultAddressId === addressId && filteredAddresses.length > 0) {
      filteredAddresses[0].isDefault = true;
      newDefaultId = filteredAddresses[0].id;
    } else if (filteredAddresses.length === 0) {
      newDefaultId = undefined;
    }

    await createOrUpdateUserProfile(userId, {
      savedAddresses: filteredAddresses,
      defaultAddressId: newDefaultId
    });
  } catch (error) {
    console.error('Adres silinemedi:', error);
    throw error;
  }
};

// Default adresi değiştir
export const setDefaultAddress = async (userId: string, addressId: string): Promise<void> => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) throw new Error('Kullanıcı profili bulunamadı');

    // Tüm adreslerin default'unu kaldır
    userProfile.savedAddresses.forEach(addr => addr.isDefault = false);
    
    // Seçilen adresi default yap
    const targetAddress = userProfile.savedAddresses.find(addr => addr.id === addressId);
    if (!targetAddress) throw new Error('Adres bulunamadı');
    
    targetAddress.isDefault = true;

    await createOrUpdateUserProfile(userId, {
      savedAddresses: userProfile.savedAddresses,
      defaultAddressId: addressId
    });
  } catch (error) {
    console.error('Default adres ayarlanamadı:', error);
    throw error;
  }
};