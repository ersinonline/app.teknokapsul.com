import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { FamilyInvitations } from './FamilyInvitations';
import {
  inviteFamilyMember,
  getPendingInvitations,
  acceptInvitation,
  rejectInvitation,
  getFamilyMembers
} from '../../services/family.service';
import { FamilyInvitation, FamilyMember } from '../../types/family';

export const FamilyManagement = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return;

      try {
        const [pendingInvites, members] = await Promise.all([
          getPendingInvitations(user.email),
          getFamilyMembers(user.email)
        ]);
        setInvitations(pendingInvites);
        setFamilyMembers(members);
      } catch (err) {
        setError('Aile üyeleri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    
    setInviteError(null);
    try {
      await inviteFamilyMember(user.email, email);
      setEmail('');
    } catch (err) {
      setInviteError('Davet gönderilirken bir hata oluştu.');
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
    } catch (err) {
      setError('Davet kabul edilirken bir hata oluştu.');
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await rejectInvitation(invitationId);
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
    } catch (err) {
      setError('Davet reddedilirken bir hata oluştu.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      <FamilyInvitations
        invitations={invitations}
        onAccept={handleAcceptInvitation}
        onReject={handleRejectInvitation}
      />

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">Aile Üyeleri</h2>
        
        <form onSubmit={handleInvite} className="mb-6">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresi"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
          {inviteError && (
            <p className="mt-2 text-sm text-red-600">{inviteError}</p>
          )}
        </form>

        <div className="space-y-4">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-gray-600">{member.email}</p>
                {member.totalDebt && (
                  <p className="text-sm text-gray-600">
                    Toplam Borç: {member.totalDebt.toFixed(2)} TL
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`p-2 rounded-lg ${
                    member.sharedExpenses
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600'
                  } hover:bg-opacity-75`}
                >
                  <Shield className="w-5 h-5" />
                </button>
                <button
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};