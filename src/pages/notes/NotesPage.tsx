import React, { useState } from 'react';
import { Plus, Search, FileText, Filter, Grid } from 'lucide-react';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { Note } from '../../types/notes';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { NoteEditor } from '../../components/notes/NoteEditor';
import { NoteCard } from '../../components/notes/NoteCard';
import { Modal } from '../../components/common/Modal';

export const NotesPage = () => {
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

  const handleDelete = async () => {
    await reload();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Notlar yüklenirken bir hata oluştu." />;

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6" style={{ color: '#ffb700' }} />
              <h1 className="text-xl font-semibold text-gray-900">Notlarım</h1>
            </div>
            <button
              onClick={() => {
                setCurrentNote(null);
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-2 bg-[#ffb700] text-white px-4 py-2 rounded-lg hover:bg-[#e6a600] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Yeni Not</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto lg:max-w-7xl px-4 py-4 space-y-6">

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5" style={{ color: '#ffb700' }} />
            <h2 className="text-lg font-semibold text-gray-900">Arama ve Filtreleme</h2>
          </div>
          <div className="flex flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Notlarda ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent bg-white text-gray-900"
                style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent appearance-none bg-white text-gray-900 min-w-[150px]"
                style={{ '--tw-ring-color': '#ffb700' } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = '#ffb700'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                <option value="">Tümü</option>
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || selectedTag ? 'Arama kriterlerinize uygun not bulunamadı' : 'Henüz not yok'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedTag 
                  ? 'Farklı arama terimleri veya filtreler deneyebilirsiniz.'
                  : 'İlk notunuzu oluşturmak için yukarıdaki "Yeni Not Ekle" butonunu kullanın.'
                }
              </p>
              {(searchTerm || selectedTag) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTag(null);
                  }}
                  className="font-medium"
                  style={{ color: '#ffb700' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#e6a500'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#ffb700'}
                >
                  Filtreleri temizle
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Grid className="w-5 h-5" style={{ color: '#ffb700' }} />
                <h2 className="text-lg font-semibold text-gray-900">Notlarım</h2>
                <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#ffb700' + '20', color: '#ffb700' }}>
                  {filteredNotes.length} not
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => {
                      setCurrentNote(note);
                      setIsEditorOpen(true);
                    }}
                    onDelete={handleDelete}
                    onView={() => {
                      setCurrentNote(note);
                      setIsViewOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
};