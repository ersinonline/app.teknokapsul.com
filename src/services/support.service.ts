import { collection, addDoc, query, orderBy, getDocs, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SupportTicket, SupportTicketFormData, SupportTicketReply } from '../types/support';

// Destek talebi oluştur
export const createSupportTicket = async (ticketData: SupportTicketFormData): Promise<string> => {
  try {
    const ticketWithTimestamp = {
      ...ticketData,
      status: 'open' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'teknokapsul-help'), ticketWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error('Destek talebi oluşturulurken hata:', error);
    throw error;
  }
};

// Kullanıcının destek taleplerini getir
export const getUserSupportTickets = async (userEmail: string): Promise<SupportTicket[]> => {
  try {
    const q = query(
      collection(db, 'teknokapsul-help'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tickets: SupportTicket[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === userEmail) {
        tickets.push({
          id: doc.id,
          ...data
        } as SupportTicket);
      }
    });
    
    return tickets;
  } catch (error) {
    console.error('Kullanıcı destek talepleri getirilirken hata:', error);
    throw error;
  }
};

// Tüm destek taleplerini getir (admin için)
export const getAllSupportTickets = async (): Promise<SupportTicket[]> => {
  try {
    const q = query(
      collection(db, 'teknokapsul-help'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tickets: SupportTicket[] = [];
    
    querySnapshot.forEach((doc) => {
      tickets.push({
        id: doc.id,
        ...doc.data()
      } as SupportTicket);
    });
    
    return tickets;
  } catch (error) {
    console.error('Tüm destek talepleri getirilirken hata:', error);
    throw error;
  }
};

// Destek talebi durumunu güncelle
export const updateSupportTicketStatus = async (
  ticketId: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
): Promise<void> => {
  try {
    const ticketRef = doc(db, 'teknokapsul-help', ticketId);
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    await updateDoc(ticketRef, updateData);
  } catch (error) {
    console.error('Destek talebi güncellenirken hata:', error);
    throw error;
  }
};

export const addReplyToSupportTicket = async (
  ticketId: string,
  message: string,
  isAdmin: boolean,
  authorName: string,
  authorEmail: string
): Promise<void> => {
  try {
    const reply: Omit<SupportTicketReply, 'id'> = {
      message,
      isAdmin,
      authorName,
      authorEmail,
      createdAt: new Date()
    };

    const replyWithId: SupportTicketReply = {
      ...reply,
      id: Date.now().toString()
    };

    const ticketRef = doc(db, 'teknokapsul-help', ticketId);
    await updateDoc(ticketRef, {
      replies: arrayUnion(replyWithId),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Cevap eklenirken hata:', error);
    throw new Error('Cevap eklenemedi');
  }
};

// Destek talebini sil
export const deleteSupportTicket = async (ticketId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'teknokapsul-help', ticketId));
  } catch (error) {
    console.error('Destek talebi silinirken hata:', error);
    throw error;
  }
};

// Destek talebini güncelle
export const updateSupportTicket = async (
  ticketId: string,
  updateData: Partial<SupportTicket>
): Promise<void> => {
  try {
    const ticketRef = doc(db, 'teknokapsul-help', ticketId);
    await updateDoc(ticketRef, {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Destek talebi güncellenirken hata:', error);
    throw error;
  }
};