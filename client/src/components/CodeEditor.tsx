import Editor from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
}

const getMonacoLanguage = (filename: string) => {
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
  if (filename.endsWith('.css')) return 'css';
  if (filename.endsWith('.html')) return 'html';
  if (filename.endsWith('.json')) return 'json';
  return 'plaintext';
};

export function CodeEditor({ code, language, onChange, readOnly = false }: CodeEditorProps) {
  // We'll use 'vs-dark' as the base theme for our dark mode app
  return (
    <div className="w-full h-full relative group">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        language={getMonacoLanguage(language)}
        value={code}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          fontLigatures: true,
          scrollBeyondLastLine: false,
          readOnly,
          padding: { top: 16, bottom: 16 },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          lineHeight: 24,
          roundedSelection: false,
          automaticLayout: true,
        }}
        loading={
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
      />
    </div>
  );
}
