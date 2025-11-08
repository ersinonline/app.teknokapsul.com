import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Subscription } from '../../types/subscription';
import { Loan } from '../../types/financial';
import { Calendar, Tag, Landmark } from 'lucide-react';
import { format, isFuture, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface UpcomingPayment {
  name: string;
  amount: number;
  dueDate: Date;
  type: 'subscription' | 'loan';
}

const YaklasanOdemeler: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<UpcomingPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingPayments = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const upcoming: UpcomingPayment[] = [];
        const today = new Date();

        // Fetch active subscriptions
        const subsQuery = query(
          collection(db, 'teknokapsul', user.id, 'subscriptions'),
          where('isActive', '==', true),
          where('autoRenew', '==', true)
        );
        const subsSnapshot = await getDocs(subsQuery);
        subsSnapshot.forEach((doc) => {
          const sub = doc.data() as Subscription;
          if (sub.renewalDay) {
            let nextRenewalDate = new Date(today.getFullYear(), today.getMonth(), sub.renewalDay);
            if (nextRenewalDate < today) {
              nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
            }
            if (isFuture(nextRenewalDate)) {
              upcoming.push({
                name: sub.name,
                amount: sub.price,
                dueDate: nextRenewalDate,
                type: 'subscription',
              });
            }
          }
        });

        // Fetch active loans
        const loansQuery = query(
          collection(db, 'teknokapsul', user.id, 'loans'),
          where('isActive', '==', true)
        );
        const loansSnapshot = await getDocs(loansQuery);
        loansSnapshot.forEach((doc) => {
          const loan = doc.data() as Loan;
          const nextPaymentDate = parseISO(loan.nextPaymentDate as unknown as string);
          if (isFuture(nextPaymentDate)) {
            upcoming.push({
              name: loan.name,
              amount: loan.monthlyPayment,
              dueDate: nextPaymentDate,
              type: 'loan',
            });
          }
        });

        // Sort by due date and take the first 5
        const sortedPayments = upcoming.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, 5);
        setPayments(sortedPayments);

      } catch (error) {
        console.error("Error fetching upcoming payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingPayments();
  }, [user]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-bold text-gray-800 mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-blue-500" />
        Yaklaşan Ödemeler
      </h2>
      {loading ? (
        <p className="text-center text-gray-500">Yükleniyor...</p>
      ) : payments.length > 0 ? (
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.type === 'subscription' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                  {payment.type === 'subscription' ? <Tag size={20} /> : <Landmark size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{payment.name}</p>
                  <p className="text-xs text-gray-500">
                    {format(payment.dueDate, 'd MMMM yyyy', { locale: tr })}
                  </p>
                </div>
              </div>
              <p className="font-bold text-sm text-red-600">
                -₺{payment.amount.toLocaleString('tr-TR')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">Yaklaşan ödeme bulunmuyor.</p>
      )}
    </div>
  );
};

export default YaklasanOdemeler;