import React from 'react';
import { Check, X } from 'lucide-react';
import { FamilyInvitation } from '../../types/family';

interface FamilyInvitationsProps {
  invitations: FamilyInvitation[];
  onAccept: (invitationId: string) => void;
  onReject: (invitationId: string) => void;
}

export const FamilyInvitations: React.FC<FamilyInvitationsProps> = ({
  invitations,
  onAccept,
  onReject,
}) => {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-lg font-medium mb-4">Bekleyen İstekler</h2>
      <div className="space-y-4">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium">{invitation.senderEmail}</p>
              <p className="text-sm text-gray-600">
                {new Date(invitation.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAccept(invitation.id)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                title="Kabul Et"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => onReject(invitation.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Reddet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};