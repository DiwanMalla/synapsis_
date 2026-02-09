"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, Search, Brain, Pencil, Trash2, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { createNote, getNotes, searchNotes, updateNote, deleteNote } from "@/lib/actions";
import type { Note } from "@/lib/supabase";

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

  // Handle form submission
  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    const result = await createNote(content);
    if (result.success && result.note) {
      setNotes((prev) => [result.note!, ...prev]);
      setContent("");
    }
    setIsLoading(false);
  };

  // Handle keyboard shortcut (Cmd+Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  // Format relative time
  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    // Ensure valid date
    if (isNaN(date.getTime())) return "";
    
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
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

  // Handle search on Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Clear search and show all notes
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  // Start editing a note
  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  // Save edited note
  const handleUpdate = async () => {
    if (!editingId || !editContent.trim()) return;

    setIsUpdating(true);
    const result = await updateNote(editingId, editContent);
    if (result.success && result.note) {
      setNotes((prev) =>
        prev.map((n) => (n.id === editingId ? result.note! : n))
      );
      setEditingId(null);
      setEditContent("");
    }
    setIsUpdating(false);
  };

  // Delete a note
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await deleteNote(id);
    if (result.success) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      {/* 1. Header Section */}
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-500" />
          Synapse
        </h1>
        <p className="text-zinc-400">Your second brain. Connected by AI.</p>
      </div>

      {/* 2. The Input Nexus */}
      <div className="w-full max-w-2xl space-y-8">
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-6 space-y-4">
            <Textarea
              placeholder="What's on your mind? (e.g., 'React 19 features', 'Grocery list', 'Startup idea...')"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="min-h-30 resize-none bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-purple-500/50"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">
                Press ⌘+Enter to save
              </span>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !content.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Capture Thought
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 3. Semantic Search */}
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-zinc-400">
                AI Semantic Search
              </span>
              <span className="text-xs text-zinc-600">
                Finds related concepts, not just keywords
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search your thoughts... (e.g., 'productivity', 'coding', 'ideas')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
              {showSearch && (
                <Button
                  onClick={clearSearch}
                  variant="ghost"
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Search Results */}
            {showSearch && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <p className="text-xs text-zinc-500">
                  {isSearching
                    ? "Searching with AI..."
                    : `Found ${searchResults.length} related thoughts`}
                </p>
                <ScrollArea className="h-40 w-full">
                  <div className="space-y-2">
                    {searchResults.length === 0 && !isSearching ? (
                      <p className="text-sm text-zinc-600 text-center py-4">
                        No related thoughts found. Try different keywords!
                      </p>
                    ) : (
                      searchResults.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-start gap-3 rounded-lg p-2 hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="h-2 w-2 mt-2 rounded-full bg-green-500/50" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-300 wrap-break-word">
                              {note.content}
                            </p>
                            <span className="text-xs text-zinc-600">
                              {getRelativeTime(note.created_at)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Recent Thoughts */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
            Recent Activity ({notes.length})
          </h2>
          <ScrollArea className="h-50 w-full rounded-md border border-zinc-800 bg-zinc-900/20 p-4">
            <div className="space-y-4">
              {isFetching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-zinc-600 text-center py-8">
                  No thoughts yet. Start by capturing your first idea above!
                </p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-4 rounded-lg p-3 hover:bg-zinc-800/50 transition-colors group"
                  >
                    <div className="h-2 w-2 mt-2 rounded-full bg-purple-500/50 group-hover:bg-purple-400" />
                    <div className="flex-1 min-w-0">
                      {editingId === note.id ? (
                        // Edit mode
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-20 resize-none bg-zinc-900 border-zinc-700 text-zinc-100 text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleUpdate}
                              disabled={isUpdating}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="text-zinc-400"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <p className="text-sm text-zinc-300 leading-relaxed wrap-break-word">
                            {note.content}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-zinc-600">
                              {getRelativeTime(note.created_at)}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(note)}
                                className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-300"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(note.id)}
                                disabled={deletingId === note.id}
                                className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400"
                              >
                                {deletingId === note.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </main>
  );
}
