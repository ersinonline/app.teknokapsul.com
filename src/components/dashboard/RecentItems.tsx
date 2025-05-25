import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';

interface RecentItemsProps {
  title: string;
  items: any[];
  type: 'orders' | 'applications' | 'payments' | 'subscriptions';
  route: string;
  showItemDetails?: boolean;
}

export const RecentItems: React.FC<RecentItemsProps> = ({
  title,
  items,
  type,
  route,
  showItemDetails = true,
}) => {
  const getStatusIcon = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'onaylandı':
      case 'approved':
      case 'ödendi':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'onay bekliyor':
      case 'pending':
      case 'ödenmedi':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'reddedildi':
      case 'rejected':
      case 'iptal edildi':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'onaylandı':
      case 'approved':
      case 'ödendi':
        return 'bg-green-100 text-green-800';
      case 'onay bekliyor':
      case 'pending':
      case 'ödenmedi':
        return 'bg-yellow-100 text-yellow-800';
      case 'reddedildi':
      case 'rejected':
      case 'iptal edildi':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Onay Bekliyor';
      case 'approved':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      default:
        return status || 'Unknown';
    }
  };

  const renderItem = (item: any) => {
    switch (type) {
      case 'orders':
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{item.orderNumber}</p>
              <p className="text-sm text-gray-500">{formatDate(item.orderDate)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(item.orderStatus)}`}>
                {getStatusIcon(item.orderStatus)}
                {item.orderStatus || 'Unknown'}
              </span>
              <span className="font-medium">{item.total}</span>
            </div>
          </div>
        );

      case 'applications':
        return (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">
                  {item.category && item.brand ? (
                    <span>{item.category} / {item.brand}</span>
                  ) : (
                    <span>{item.type}</span>
                  )}
                </h3>
              </div>
              {item.details && (
                <p className="text-sm text-gray-500">{item.details}</p>
              )}
              <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(item.status)}`}>
              {getStatusIcon(item.status)}
              {getStatusText(item.status)}
            </span>
          </div>
        );

      case 'payments':
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{item.description}</p>
              <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(item.status)}`}>
                {getStatusIcon(item.status)}
                {item.status || 'Unknown'}
              </span>
              <span className="font-medium">{formatCurrency(item.amount)}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{title}</h2>
          <Link
            to={route}
            className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center"
          >
            Tümünü Gör
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
      <div className="divide-y">
        {items.map((item) => (
          <div key={item.id} className="p-4 hover:bg-gray-50">
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
};