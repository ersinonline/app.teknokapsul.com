import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useFirebaseData } from '../../hooks/useFirebaseData';

interface DetailViewProps {
  type: 'payments' | 'subscriptions';
  renderContent: (data: any) => React.ReactNode;
}

export const DetailView: React.FC<DetailViewProps> = ({ type, renderContent }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useFirebaseData(type, id);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={`Veriler yüklenirken bir hata oluştu: ${error.message}`} />;
  if (!data) return <ErrorMessage message="Kayıt bulunamadı" />;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Geri Dön
      </button>
      {renderContent(data)}
    </div>
  );
};