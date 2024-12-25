import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const FeedbackForm = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4">Geri Bildirim</h2>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => setRating(value)}
            className={`p-2 rounded-lg transition-colors ${
              rating >= value ? 'text-yellow-500' : 'text-gray-300'
            }`}
          >
            <Star className="w-6 h-6 fill-current" />
          </button>
        ))}
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Deneyiminizi bizimle paylaşın..."
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 mb-4"
        rows={4}
      />
      <button className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700">
        Gönder
      </button>
    </div>
  );
};