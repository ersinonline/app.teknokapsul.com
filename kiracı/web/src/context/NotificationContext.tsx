import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, updateDoc, doc, Timestamp } from 'firebase/firestore';

interface Notification {
    id: string;
    type: 'payment_due' | 'payment_success' | 'request_new' | 'contract_new' | 'payout_ready' | 'system';
    title: string;
    message: string;
    read: boolean;
    createdAt: Timestamp;
    actionUrl?: string;
    metadata?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const q = query(
            collection(db, 'accounts', user.uid, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Notification));
            setNotifications(notifs);
        });

        return () => unsubscribe();
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = async (id: string) => {
        if (!user) return;
        const notifRef = doc(db, 'accounts', user.uid, 'notifications', id);
        await updateDoc(notifRef, { read: true });
    };

    const markAllAsRead = async () => {
        if (!user) return;
        const promises = notifications
            .filter(n => !n.read)
            .map(n => updateDoc(doc(db, 'accounts', user.uid, 'notifications', n.id), { read: true }));
        await Promise.all(promises);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
};
