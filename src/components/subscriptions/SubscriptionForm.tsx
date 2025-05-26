import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SubscriptionFormData } from '../../types/subscription';

interface SubscriptionFormProps {
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
  isLoading?: boolean;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<SubscriptionFormData>({
    defaultValues: {
      autoRenew: false,
      price: 0
    }
  });
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const autoRenew = watch('autoRenew');

  const onFormSubmit = async (data: SubscriptionFormData) => {
    setSubmissionError(null);
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmissionError('Form gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Abonelik Adı
        </label>
        <input
          type="text"
          id="name"
          {...register('name', { required: 'Abonelik adı gerekli' })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50"
          placeholder="Netflix, Spotify vb."
          disabled={isLoading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          Aylık Ücret
        </label>
        <input
          type="number"
          id="price"
          step="0.01"
          {...register('price', { required: 'Ücret bilgisi gerekli', min: 0 })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="autoRenew"
          {...register('autoRenew')}
          className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
        />
        <label htmlFor="autoRenew" className="text-sm font-medium text-gray-700">
          Otomatik Yenileme
        </label>
      </div>

      {autoRenew ? (
        <div>
          <label htmlFor="renewalDay" className="block text-sm font-medium text-gray-700">
            Yenileme Günü
          </label>
          <input
            type="number"
            id="renewalDay"
            min="1"
            max="31"
            {...register('renewalDay', {
              required: 'Yenileme günü gerekli',
              min: { value: 1, message: 'Gün 1-31 arasında olmalı' },
              max: { value: 31, message: 'Gün 1-31 arasında olmalı' }
            })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50"
            placeholder="Örn: 15"
            disabled={isLoading}
          />
          {errors.renewalDay && (
            <p className="mt-1 text-sm text-red-600">{errors.renewalDay.message}</p>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            Bitiş Tarihi
          </label>
          <input
            type="date"
            id="endDate"
            {...register('endDate', { required: 'Bitiş tarihi gerekli' })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50"
            min={new Date().toISOString().split('T')[0]}
            disabled={isLoading}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
          )}
        </div>
      )}

      {submissionError && (
        <p className="mt-2 text-sm text-red-600">{submissionError}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-yellow-600 px-4 py-2 text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </form>
  );
};