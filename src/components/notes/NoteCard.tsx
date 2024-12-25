import React, { useState } from 'react';
import { Edit2, Trash2, Calendar, Tag } from 'lucide-react';
import { Note } from '../../types/notes';
import { deleteNote } from '../../services/notes.service';
import { formatDate } from '../../utils/date';

interface NoteCardProps {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
      try {
        await deleteNote(note.id);
        onDelete();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const Modal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">{note.title}</h3>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ✕
          </button>
        </div>
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{note.content}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {note.tags?.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium text-gray-900">{note.title}</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div 
            className="text-gray-600 mb-4 line-clamp-3 cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            {note.content}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {note.tags?.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(note.createdAt)}
          </div>
        </div>
      </div>

      {isModalOpen && <Modal />}
    </>
  );
};