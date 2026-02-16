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
    <div className="page-container bg-background">
      {/* Header */}
      <div className="bank-gradient px-4 pt-4 pb-10">
        <div className="page-content">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Notlarım</h1>
                <p className="text-white/60 text-xs">{filteredNotes.length} not</p>
              </div>
            </div>
            <button
              onClick={() => { setCurrentNote(null); setIsEditorOpen(true); }}
              className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="page-content -mt-5">
        {/* Search & Filter */}
        <div className="bank-card p-3 mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Notlarda ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            {tags.length > 0 && (
              <select
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="px-3 py-2.5 border border-border rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[100px]"
              >
                <option value="">Tümü</option>
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="bank-card p-10 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {searchTerm || selectedTag ? 'Sonuç bulunamadı' : 'Henüz not yok'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {searchTerm || selectedTag ? 'Farklı filtreler deneyin.' : 'İlk notunuzu oluşturun.'}
            </p>
            {(searchTerm || selectedTag) && (
              <button onClick={() => { setSearchTerm(''); setSelectedTag(null); }} className="text-xs font-medium text-primary">
                Filtreleri temizle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => { setCurrentNote(note); setIsEditorOpen(true); }}
                onDelete={handleDelete}
                onView={() => { setCurrentNote(note); setIsViewOpen(true); }}
              />
            ))}
          </div>
        )}

        {isEditorOpen && (
          <NoteEditor
            note={currentNote}
            onClose={() => setIsEditorOpen(false)}
            onSave={async () => { await reload(); setIsEditorOpen(false); }}
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