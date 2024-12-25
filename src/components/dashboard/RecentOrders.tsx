import React from 'react';
import { Order } from '../../types/data';
import { formatCurrency } from '../../utils/currency';

interface RecentOrdersProps {
  orders: Order[];
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ orders }) => {
  // Son siparişleri hesapla
  const recentOrders = orders.slice(0, 3).map((order) => ({
    id: order.id,
    number: order.orderNumber,
    total: order.products
      ? order.products.reduce(
          (sum, product) => sum + parseFloat(product.amount.replace(' TL', '').replace(',', '.')),
          0
        )
      : order.total,
    status: order.orderStatus,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Başlık */}
      <h2 className="text-lg font-semibold mb-4">Son Siparişler</h2>

      {/* Sipariş Listesi */}
      <div className="space-y-4">
        {recentOrders.length > 0 ? (
          recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{order.number}</p>
                <p className="text-sm text-gray-600">{formatCurrency(order.total)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    order.status === 'Tamamlandı'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'İşleniyor'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">Son sipariş bulunamadı.</p>
        )}
      </div>
    </div>
  );
};