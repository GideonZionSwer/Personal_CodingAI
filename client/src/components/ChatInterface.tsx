import { useState, useRef, useEffect } from "react";
import { Message, File } from "@shared/schema";
import { useProjectChat } from "@/hooks/use-projects";
import { useSuggestFiles } from "@/hooks/use-files";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatInterfaceProps {
  projectId: number;
  messages: Message[];
  files: File[];
}

export function ChatInterface({ projectId, messages, files }: ChatInterfaceProps) {
  const [prompt, setPrompt] = useState("");
  const [showFileSuggestions, setShowFileSuggestions] = useState(false);
  const [fileQuery, setFileQuery] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const chatMutation = useProjectChat(projectId);
  const fileSuggestions = useSuggestFiles(projectId, fileQuery);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatMutation.isPending]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPrompt(value);
    setCursorPos(e.target.selectionStart);

    // Check for @ mention
    const beforeCursor = value.substring(0, e.target.selectionStart);
    const lastAtIndex = beforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const query = beforeCursor.substring(lastAtIndex + 1);
      if (query && !query.includes(" ")) {
        setFileQuery(query);
        setShowFileSuggestions(true);
      } else {
        setShowFileSuggestions(false);
      }
    } else {
      setShowFileSuggestions(false);
    }
  };

  const handleSelectFile = (file: File) => {
    const beforeCursor = prompt.substring(0, cursorPos);
    const lastAtIndex = beforeCursor.lastIndexOf("@");
    const afterCursor = prompt.substring(cursorPos);
    
    const newPrompt = 
      prompt.substring(0, lastAtIndex) + 
      `@${file.path} ` + 
      afterCursor;
    
    setPrompt(newPrompt);
    setShowFileSuggestions(false);
    setFileQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || chatMutation.isPending) return;
    
    chatMutation.mutate(prompt, {
      onSuccess: () => setPrompt(""),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !showFileSuggestions) {
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
        <p className="text-xs text-muted-foreground mt-1">Type @ to mention files</p>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground my-10 space-y-2">
              <Bot className="w-12 h-12 mx-auto opacity-20" />
              <p>Ask me to generate code or modify files.</p>
              <p className="text-xs">Use @filename to reference files</p>
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

      <div className="p-4 border-t border-border/50 bg-secondary/10">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <Popover open={showFileSuggestions} onOpenChange={setShowFileSuggestions}>
              <PopoverTrigger asChild>
                <Textarea
                  ref={textareaRef}
                  placeholder="Type @ to mention files... Ask anything!"
                  value={prompt}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  className="min-h-[80px] text-sm resize-none"
                />
              </PopoverTrigger>
              {showFileSuggestions && (
                <PopoverContent className="w-[300px] p-0" side="top">
                  <Command>
                    <CommandList>
                      {fileSuggestions.data && fileSuggestions.data.length > 0 ? (
                        <CommandGroup>
                          {fileSuggestions.data.map((file) => (
                            <CommandItem
                              key={file.id}
                              value={file.path}
                              onSelect={() => handleSelectFile(file)}
                              className="cursor-pointer"
                            >
                              <FileIcon className="w-4 h-4 mr-2" />
                              {file.path}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ) : (
                        <CommandEmpty>No files found</CommandEmpty>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
          </div>
          
          <Button 
            type="submit" 
            disabled={!prompt.trim() || chatMutation.isPending}
            className="w-full gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
