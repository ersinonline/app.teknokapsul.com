import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SubscriptionFormData } from '../../types/subscription';

interface SubscriptionFormProps {
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
  isLoading?: boolean;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SubscriptionFormData>();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

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
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
          Bitiş Tarihi
        </label>
        <input
          type="date"
          id="endDate"
          {...register('endDate', { required: 'Bitiş tarihi gerekli' })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50"
          min={new Date().toISOString().split('T')[0]} // Geçmiş tarihler engelleniyor
          disabled={isLoading}
        />
        {errors.endDate && (
          <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
        )}
      </div>

      {submissionError && (
        <p className="mt-2 text-sm text-red-600">{submissionError}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-yellow-600 px-4 py-2 text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
        aria-disabled={isLoading}
      >
        {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </form>
  );
};