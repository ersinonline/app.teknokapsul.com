import React from 'react';
import { Package, ChevronDown, ChevronUp, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Order } from '../../types/data';
import { OrderDetails } from './OrderDetails';
import { formatDate } from '../../utils/date';

interface OrderCardProps {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, isExpanded, onToggle }) => {
  const getStatusIcon = () => {
    switch (order.orderStatus) {
      case 'Tamamlandı':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'İşleniyor':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'İptal Edildi':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (order.orderStatus) {
      case 'Tamamlandı':
        return 'bg-green-100 text-green-800';
      case 'İşleniyor':
        return 'bg-yellow-100 text-yellow-800';
      case 'İptal Edildi':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      <div 
        className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-500 p-3 rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{order.orderNumber}</p>
                <span className={`px-3 py-1 text-xs rounded-full flex items-center gap-1.5 ${getStatusColor()}`}>
                  {getStatusIcon()}
                  {order.orderStatus}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(order.orderDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
            <div className="flex flex-col items-start sm:items-end">
              <span className="font-medium text-gray-900">{order.total}</span>
              <span className="text-sm text-gray-500">{order.paymentStatus}</span>
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {isExpanded && <OrderDetails order={order} />}
    </div>
  );
};