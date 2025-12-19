import { useState, useRef, useEffect } from "react";
import { Message } from "@shared/schema";
import { useProjectChat } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInterfaceProps {
  projectId: number;
  messages: Message[];
}

export function ChatInterface({ projectId, messages }: ChatInterfaceProps) {
  const [prompt, setPrompt] = useState("");
  const chatMutation = useProjectChat(projectId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatMutation.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || chatMutation.isPending) return;
    
    chatMutation.mutate(prompt, {
      onSuccess: () => setPrompt(""),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm border-l border-border/50">
      <div className="p-4 border-b border-border/50 bg-secondary/10">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Assistant
        </h3>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground my-10 space-y-2">
              <Bot className="w-12 h-12 mx-auto opacity-20" />
              <p>Ask me to generate code or modify files.</p>
            </div>
          )}
          
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-muted text-foreground border-border"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] shadow-sm",
                  msg.role === 'user' 
                    ? "bg-primary/10 text-foreground border border-primary/20 rounded-tr-sm" 
                    : "bg-secondary/50 text-secondary-foreground border border-border/50 rounded-tl-sm"
                )}>
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {chatMutation.isPending && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-muted text-foreground border border-border flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-secondary/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 border border-border/50">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-background border-t border-border/50">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[50px] max-h-[200px] pr-12 resize-none bg-secondary/30 border-border focus:ring-primary/20 scrollbar-thin rounded-xl"
            disabled={chatMutation.isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg transition-transform hover:scale-105 active:scale-95"
            disabled={!prompt.trim() || chatMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="text-xs text-muted-foreground text-center mt-2">
          AI can generate errors. Check important info.
        </div>
      </div>
    </div>
  );
}
