import React from 'react';
import { PlatformCredential } from '../../services/platformCredentials.service';
import { AccountCard } from './AccountCard';

interface AccountsListProps {
  credentials: PlatformCredential[];
  onCopy: (text: string) => void;
}

export const AccountsList: React.FC<AccountsListProps> = ({ credentials, onCopy }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {credentials.map((credential) => (
        <AccountCard
          key={credential.id}
          credential={credential}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
};