"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, Trash2, Search, X, Pencil, Check, XCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createNote, getNotes, deleteNote, searchNotes, updateNote } from "@/lib/actions";
import type { Note } from "@/lib/supabase";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Fetch all notes (Reset view)
  const loadAllNotes = useCallback(async () => {
    setIsFetching(true);
    const result = await getNotes();
    if (result.success && result.notes) {
      setNotes(result.notes);
    }
    setIsFetching(false);
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;
    if (mounted) loadAllNotes();
    return () => {
      mounted = false;
    };
  }, [loadAllNotes]);

  // Handle Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        const result = await searchNotes(searchQuery);
        if (result.success && result.notes) {
          setNotes(result.notes);
        }
        setIsSearching(false);
      } else if (searchQuery === "") {
        loadAllNotes();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, loadAllNotes]);

  // Handle Create
  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    const result = await createNote(content);
    if (result.success && result.note) {
      if (!searchQuery) {
        setNotes((prev) => [result.note!, ...prev]);
      }
      setContent("");
    }
    setIsLoading(false);
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    if(!confirm("Are you sure you want to delete this thought?")) return;
    setDeletingId(id);
    const result = await deleteNote(id.toString());
    if (result.success) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
    setDeletingId(null);
  };

  // Start Edit
  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  // Cancel Edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  // Save Edit
  const saveEdit = async () => {
    if (!editContent.trim() || !editingId) return;
    setIsSavingEdit(true);
    
    const result = await updateNote(editingId.toString(), editContent);
    
    if (result.success && result.note) {
      setNotes((prev) => 
        prev.map((n) => (n.id === editingId ? { ...n, content: editContent } : n))
      );
      setEditingId(null);
      setEditContent("");
    }
    setIsSavingEdit(false);
  };

  // Handle keyboard shortcut (Cmd+Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    if (isNaN(date.getTime())) return "";
    
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground transition-colors duration-300">
      <div className="w-full max-w-6xl flex justify-end mb-4">
        <ModeToggle />
      </div>
      
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-500" />
          Synapse
        </h1>
        <p className="text-muted-foreground">Your second brain. Connected by AI.</p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card className="border-border bg-card/50 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-6 space-y-4">
              <Textarea
                placeholder="What's on your mind? (e.g., 'React 19 features', 'Grocery list', 'Startup idea...')"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="min-h-32 resize-none bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-purple-500/50"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Press ⌘+Enter to save</span>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !content.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Capture Thought
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                {searchQuery ? "Search Results" : "Recent Activity"} ({notes.length})
              </h2>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your brain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card/20 border-border focus-visible:ring-purple-500/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <ScrollArea className="h-[400px] w-full rounded-md border border-border bg-card/20 p-4">
              <div className="space-y-4">
                {isFetching || isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  </div>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {searchQuery ? "No matching thoughts found." : "No thoughts yet. Start by capturing your first idea above!"}
                  </p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-start gap-4 rounded-lg p-3 hover:bg-accent/50 transition-colors group relative pr-20"
                    >
                      <div className={`h-2 w-2 mt-2 rounded-full shrink-0 ${note.similarity && note.similarity > 0.7 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-purple-500/50"}`} />
                      
                      <div className="flex-1 min-w-0">
                        {editingId === note.id ? (
                          <div className="space-y-2">
                            <Textarea 
                              value={editContent} 
                              onChange={(e) => setEditContent(e.target.value)}
                              className="min-h-[60px] bg-background border-purple-500/50"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEdit} disabled={isSavingEdit} className="h-7 bg-green-600 hover:bg-green-700">
                                {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7">
                                <XCircle className="w-3 h-3" /> Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-foreground leading-relaxed wrap-break-word">
                              {note.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {getRelativeTime(note.created_at)}
                              </span>
                              {note.similarity !== undefined && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">
                                  Match: {(note.similarity * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      {editingId !== note.id && (
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(note);
                            }}
                            className="h-8 w-8 hover:bg-purple-500/20 hover:text-purple-400"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(note.id);
                            }}
                            className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                          >
                            {deletingId === note.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            Neural Map
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 text-[10px]">Live</span>
          </h2>
          <KnowledgeGraph />
        </div>
      </div>
    </main>
  );
}
