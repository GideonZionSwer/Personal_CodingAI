import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, ChevronDown, Copy } from "lucide-react";

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Terminal({ isOpen, onClose }: TerminalProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string[]>([
    "Terminal initialized...",
    "Type commands to execute",
    "> "
  ]);

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const command = input.trim();
      setOutput([...output, `> ${command}`]);
      
      // Simulate command execution
      const response = simulateCommand(command);
      setOutput(prev => [...prev, ...response, "> "]);
      setInput("");
    }
  };

  const simulateCommand = (cmd: string): string[] => {
    const commands: Record<string, string[]> = {
      "ls": ["index.html", "style.css", "script.js", "package.json"],
      "pwd": ["/workspace/project"],
      "npm start": ["Starting development server...", "Server running on http://localhost:3000"],
      "npm install": ["Installing dependencies...", "Done!"],
      "python server.py": ["Server started on 0.0.0.0:5000"],
      "node index.js": ["Application running..."],
      "help": [
        "Available commands:",
        "  ls - List files",
        "  pwd - Print working directory",
        "  npm start - Start development server",
        "  npm install - Install dependencies",
        "  node <file> - Run Node.js file",
        "  python <file> - Run Python file"
      ],
      "clear": []
    };

    if (cmd === "clear") {
      setOutput(["> "]);
      return [];
    }

    return commands[cmd] || [`Command not found: ${cmd}`];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 w-96 h-80 bg-background border-t border-l border-border/50 shadow-2xl flex flex-col z-50">
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-secondary/20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm font-semibold">Terminal</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={onClose}
          data-testid="button-close-terminal"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-black/50 p-3 font-mono text-sm text-green-400 space-y-0">
        {output.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>

      <div className="border-t border-border/50 p-2 bg-secondary/10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Enter command..."
          className="w-full bg-black/50 text-green-400 font-mono text-sm outline-none"
          autoFocus
        />
      </div>
    </div>
  );
}
