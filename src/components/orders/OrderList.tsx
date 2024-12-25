import React, { useState, useCallback } from 'react';
import { OrderCard } from './OrderCard';
import { Order } from '../../types/data';

interface OrderListProps {
  orders: Order[];
  isLoading?: boolean; // Yükleme durumu için bir prop ekledim
}

export const OrderList: React.FC<OrderListProps> = ({ orders, isLoading = false }) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // toggleOrder fonksiyonunu optimize ettik
  const toggleOrder = useCallback(
    (orderId: string) => {
      setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
    },
    []
  );

  if (isLoading) {
    return <p className="text-center text-gray-500">Siparişler yükleniyor...</p>;
  }

  if (!orders || orders.length === 0) {
    return <p className="text-center text-red-500">Gösterilecek sipariş bulunmamaktadır.</p>;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          isExpanded={expandedOrderId === order.id}
          onToggle={() => toggleOrder(order.id)}
        />
      ))}
    </div>
  );
};