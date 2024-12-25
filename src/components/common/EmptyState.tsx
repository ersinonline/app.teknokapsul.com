import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="text-center py-12">
      {/* İkon */}
      <Icon className="mx-auto h-12 w-12 text-gray-400" />

      {/* Başlık */}
      <h3 className="mt-2 text-lg font-semibold text-gray-900">{title}</h3>

      {/* Açıklama */}
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
};