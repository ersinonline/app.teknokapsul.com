import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Order } from '../../types/data';
import { formatCurrency } from '../../utils/currency';

interface OrderDetailsProps {
  order: Order;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  return (
    <div className="border-t px-4 py-6 sm:px-6">
      <div className="space-y-6">
        {/* Ürün Listesi */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Sipariş İçeriği</h4>
          <div className="space-y-4">
            {order.products.map((product, index) => (
              <div key={index} className="flex items-center gap-4">
                <img
                  src={product.photoUrl}
                  alt={product.productName}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(product.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teslimat Bilgileri */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Teslimat Adresi</h4>
          <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
        </div>

        {/* Ödeme Bilgileri */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Ödeme Yöntemi</h4>
            <p className="text-sm text-gray-600">{order.paymentType}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Ödeme Durumu</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              order.paymentStatus === 'Ödendi' 
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Kargo Takip */}
        {order.trackingInfo && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Kargo Takip</h4>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">{order.trackingInfo}</p>
              {order.trackingLink && (
                <a
                  href={order.trackingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};