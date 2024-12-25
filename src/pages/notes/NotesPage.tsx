import React, { useState } from 'react';
import { Plus, Search, Tag, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { Note } from '../../types/notes';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { NoteEditor } from '../../components/notes/NoteEditor';
import { NoteCard } from '../../components/notes/NoteCard';
import { Modal } from '../../components/common/Modal';

export const NotesPage = () => {
  const { user } = useAuth();
  const { data: notes = [], loading, error, reload } = useFirebaseData<Note>('notes');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const tags = Array.from(new Set(notes.flatMap(note => note.tags || [])));

  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const handleDelete = async (noteId: string) => {
    if (window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
      // Firebase'den notu silme işlemi yapılmalı.
      // await deleteNote(noteId);
      await reload();
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Notlar yüklenirken bir hata oluştu." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Notlarım</h1>
        <button
          onClick={() => {
            setCurrentNote(null);
            setIsEditorOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Yeni Not
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="search"
            placeholder="Notlarda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`flex items-center px-3 py-1 rounded-full text-sm ${
                selectedTag === tag
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Tag className="w-4 h-4 mr-1" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={() => {
              setCurrentNote(note);
              setIsEditorOpen(true);
            }}
            onDelete={() => handleDelete(note.id)}
            onView={() => {
              setCurrentNote(note);
              setIsViewOpen(true);
            }}
          />
        ))}
      </div>

      {isEditorOpen && (
        <NoteEditor
          note={currentNote}
          onClose={() => setIsEditorOpen(false)}
          onSave={async () => {
            await reload();
            setIsEditorOpen(false);
          }}
        />
      )}

      {isViewOpen && currentNote && (
        <Modal onClose={() => setIsViewOpen(false)}>
          <h2 className="text-xl font-bold mb-4">{currentNote.title}</h2>
          <p>{currentNote.content}</p>
        </Modal>
      )}
    </div>
  );
};