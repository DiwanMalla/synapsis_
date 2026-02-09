"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createNote, getNotes } from "@/lib/actions";
import type { Note } from "@/lib/supabase";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground transition-colors duration-300">
      {/* 1. Header Section */}
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
        {/* Left Column: Input & List */}
        <div className="space-y-8">
          {/* 2. The Input Nexus */}
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
                <span className="text-xs text-muted-foreground">
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

          {/* 3. Recent Thoughts */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Recent Activity ({notes.length})
            </h2>
            <ScrollArea className="h-[400px] w-full rounded-md border border-border bg-card/20 p-4">
              <div className="space-y-4">
                {isFetching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  </div>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No thoughts yet. Start by capturing your first idea above!
                  </p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-start gap-4 rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer group"
                    >
                      <div className="h-2 w-2 mt-2 rounded-full bg-purple-500/50 group-hover:bg-purple-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed wrap-break-word">
                          {note.content}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {getRelativeTime(note.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Column: Knowledge Graph */}
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
