import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FamilyInvitation, FamilyMember } from '../types/family';

export const inviteFamilyMember = async (senderEmail: string, receiverEmail: string) => {
  const invitation: Omit<FamilyInvitation, 'id'> = {
    familyId: senderEmail, // Using sender's email as family ID
    senderEmail,
    receiverEmail,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  await addDoc(collection(db, 'family-invitations'), invitation);
};

export const getPendingInvitations = async (email: string) => {
  const invitationsRef = collection(db, 'family-invitations');
  const q = query(
    invitationsRef,
    where('receiverEmail', '==', email),
    where('status', '==', 'pending')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as FamilyInvitation));
};

export const acceptInvitation = async (invitationId: string) => {
  const invitationRef = doc(db, 'family-invitations', invitationId);
  await updateDoc(invitationRef, { status: 'accepted' });
};

export const rejectInvitation = async (invitationId: string) => {
  const invitationRef = doc(db, 'family-invitations', invitationId);
  await updateDoc(invitationRef, { status: 'rejected' });
};

export const getFamilyMembers = async (email: string): Promise<FamilyMember[]> => {
  const invitationsRef = collection(db, 'family-invitations');
  const acceptedInvitations = query(
    invitationsRef,
    where('status', '==', 'accepted'),
    where('senderEmail', '==', email)
  );
  
  const snapshot = await getDocs(acceptedInvitations);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    email: doc.data().receiverEmail,
    name: doc.data().receiverEmail.split('@')[0],
    role: 'member',
    sharedExpenses: true
  }));
};