"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Send,
  Loader2,
  Search,
  Brain,
  Pencil,
  Trash2,
  X,
  Check,
  Zap,
  Network,
  Plus,
  Command,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  createNote,
  getNotes,
  searchNotes,
  updateNote,
  deleteNote,
} from "@/lib/actions";
import type { Note } from "@/lib/supabase";
import KnowledgeGraph from "@/components/KnowledgeGraph";

export default function Home() {
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Edit/Delete state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // UI state
  const [showInput, setShowInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch notes on mount
  useEffect(() => {
    let mounted = true;
    const loadNotes = async () => {
      setIsFetching(true);
      const result = await getNotes();
      if (mounted && result.success && result.notes) {
        setNotes(result.notes);
      }
      if (mounted) setIsFetching(false);
    };
    loadNotes();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-focus textarea when input panel opens
  useEffect(() => {
    if (showInput && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showInput]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    const result = await createNote(content);
    if (result.success && result.note) {
      setNotes((prev) => [result.note!, ...prev]);
      setContent("");
      setShowInput(false);
    }
    setIsLoading(false);
  };

  // Handle keyboard shortcut (Cmd+Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit();
    }
    if (e.key === "Escape") {
      setShowInput(false);
    }
  };

  // Format relative time
  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    if (isNaN(date.getTime())) return "";

    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Handle semantic search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    setIsSearching(true);
    setShowSearch(true);
    const result = await searchNotes(searchQuery, 5);
    if (result.success && result.notes) {
      setSearchResults(result.notes);
    }
    setIsSearching(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      clearSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleUpdate = async () => {
    if (!editingId || !editContent.trim()) return;

    setIsUpdating(true);
    const result = await updateNote(editingId, editContent);
    if (result.success && result.note) {
      setNotes((prev) =>
        prev.map((n) => (n.id === editingId ? result.note! : n)),
      );
      setEditingId(null);
      setEditContent("");
    }
    setIsUpdating(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await deleteNote(id);
    if (result.success) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
    setDeletingId(null);
  };

  const displayedNotes = showSearch ? searchResults : notes;

  return (
    <main className="mesh-bg noise-overlay h-screen w-screen overflow-hidden text-zinc-100 flex flex-col">
      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] glass-panel z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-5 h-5 text-purple-400" />
            <div className="absolute inset-0 blur-md bg-purple-500/30 rounded-full" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight gradient-text">
            Synapse
          </h1>
          <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest ml-1">
            v0.1
          </span>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
            <Input
              placeholder="Search your mind..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9 pr-20 h-8 text-xs bg-white/[0.03] border-white/[0.06] rounded-lg text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-purple-500/30 focus-visible:border-purple-500/30 transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {showSearch && (
                <button
                  onClick={clearSearch}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 rounded bg-white/[0.04] transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-purple-400 px-1.5 py-0.5 rounded bg-white/[0.04] disabled:opacity-30 transition-colors"
              >
                {isSearching ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                ) : (
                  <Brain className="w-2.5 h-2.5" />
                )}
                AI
              </button>
            </div>
          </div>
        </div>

        {/* Right: Stats + New */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
            <span>{notes.length} thoughts</span>
          </div>
          <button
            onClick={() => setShowInput(!showInput)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-500/80 text-white text-xs font-medium transition-all hover:shadow-lg hover:shadow-purple-900/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel: Notes ── */}
        <aside className="w-[380px] shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden">
          {/* Input Panel (collapsible) */}
          {showInput && (
            <div className="p-4 border-b border-white/[0.06] animate-fade-in-up glass-panel-light">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Capture thought
                  </span>
                  <button
                    onClick={() => setShowInput(false)}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Textarea
                  ref={textareaRef}
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="min-h-[100px] resize-none bg-white/[0.02] border-white/[0.06] text-zinc-200 text-sm placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-purple-500/30 rounded-lg"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                    <Command className="w-2.5 h-2.5" /> + Enter to save
                  </span>
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !content.trim()}
                    size="sm"
                    className="bg-purple-600/80 hover:bg-purple-500 text-white text-xs h-7 px-3 rounded-lg disabled:opacity-30 transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3 mr-1.5" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Search results header */}
          {showSearch && (
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-mono">
                {isSearching
                  ? "Searching..."
                  : `${searchResults.length} results found`}
              </span>
              <button
                onClick={clearSearch}
                className="text-[10px] text-purple-400/60 hover:text-purple-400 transition-colors"
              >
                Show all
              </button>
            </div>
          )}

          {/* Notes list header */}
          {!showSearch && (
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                Recent
              </span>
              <span className="text-[10px] text-zinc-700 font-mono">
                {notes.length}
              </span>
            </div>
          )}

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isFetching ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
                  <span className="text-[10px] text-zinc-700">
                    Loading thoughts...
                  </span>
                </div>
              </div>
            ) : displayedNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center mb-3">
                  <Brain className="w-5 h-5 text-zinc-700" />
                </div>
                <p className="text-xs text-zinc-600 mb-1">
                  {showSearch ? "No matches found" : "No thoughts yet"}
                </p>
                <p className="text-[10px] text-zinc-700">
                  {showSearch
                    ? "Try different keywords"
                    : "Capture your first idea to get started"}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {displayedNotes.map((note, index) => (
                  <div
                    key={note.id}
                    className="note-card px-4 py-3 border-b border-white/[0.03] group"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {editingId === note.id ? (
                      /* Edit mode */
                      <div className="space-y-2 animate-fade-in-up">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[72px] resize-none bg-white/[0.03] border-white/[0.08] text-zinc-200 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-purple-500/30"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-md bg-emerald-500/10 transition-colors"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              <Check className="w-2.5 h-2.5" />
                            )}
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded-md bg-white/[0.03] transition-colors"
                          >
                            <X className="w-2.5 h-2.5" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <>
                        <p className="text-[13px] text-zinc-300 leading-relaxed break-words">
                          {note.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-zinc-700 font-mono">
                            {getRelativeTime(note.created_at)}
                          </span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(note)}
                              className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-all"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(note.id)}
                              disabled={deletingId === note.id}
                              className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              {deletingId === note.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Right Panel: Knowledge Graph ── */}
        <section className="flex-1 flex flex-col overflow-hidden relative">
          {/* Graph label */}
          <div className="absolute top-4 left-5 z-10 flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel">
              <Network className="w-3.5 h-3.5 text-purple-400/70" />
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                Knowledge Graph
              </span>
            </div>
          </div>

          {/* Graph visualization */}
          <div className="flex-1">
            <KnowledgeGraph />
          </div>
        </section>
      </div>
    </main>
  );
}
