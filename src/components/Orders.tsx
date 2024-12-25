import React, { useState } from 'react';
import { Package, Filter } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import { OrderList } from './orders/OrderList';
import { EmptyState } from './common/EmptyState';
import { Order } from '../types/data';

export const Orders = () => {
  const { data: orders = [], loading, error } = useFirebaseData<Order>('orders');
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="Siparişler yüklenirken bir hata oluştu." />;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Sipariş Bulunamadı"
        description="Henüz hiç sipariş vermediniz."
      />
    );
  }

  const filteredOrders = orders.filter((order) =>
    order.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Siparişlerim</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="search"
              placeholder="Sipariş ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Sipariş ara"
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <span className="absolute right-3 top-2.5 text-gray-400">
              <Filter className="w-5 h-5" />
            </span>
          </div>
        </div>
      </div>
      {filteredOrders.length > 0 ? (
        <OrderList orders={filteredOrders} />
      ) : (
        <EmptyState
          icon={Package}
          title="Eşleşen Sipariş Bulunamadı"
          description="Aramanıza uygun bir sipariş bulunamadı. Lütfen farklı bir anahtar kelime deneyin."
        />
      )}
    </div>
  );
};