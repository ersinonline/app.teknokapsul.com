import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Vehicle, VehicleFormData } from '../types/vehicle';

export const getUserVehicles = async (userId: string): Promise<Vehicle[]> => {
  try {
    const vehiclesRef = collection(db, 'vehicles');
    const q = query(vehiclesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Vehicle));
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

export const addVehicle = async (userId: string, data: VehicleFormData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'vehicles'), {
      ...data,
      userId,
      documents: {},
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

export const uploadVehicleDocument = async (
  vehicleId: string,
  documentType: 'insurance' | 'inspection' | 'maintenance',
  file: File
): Promise<string> => {
  try {
    const fileRef = ref(storage, `vehicles/${vehicleId}/${documentType}/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, {
      [`documents.${documentType}`]: url
    });
    
    return url;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};