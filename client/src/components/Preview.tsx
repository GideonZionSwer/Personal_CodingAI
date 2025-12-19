import { useEffect, useRef } from "react";
import { File } from "@shared/schema";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewProps {
  files: File[];
  refreshTrigger: number;
}

export function Preview({ files, refreshTrigger }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const htmlFile = files.find(f => f.path.endsWith('index.html') || f.path.endsWith('main.html'));
    const cssFiles = files.filter(f => f.path.endsWith('.css'));
    const jsFiles = files.filter(f => f.path.endsWith('.js'));

    if (!htmlFile) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <style>
            body { 
              font-family: sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              background: #09090b; 
              color: #a1a1aa;
            }
          </style>
          <body>
            <div>No index.html found. Please create one to see a preview.</div>
          </body>
        `);
        doc.close();
      }
      return;
    }

    // Naive bundle injection
    // In a real app, we'd use a service worker or more robust bundler
    let content = htmlFile.content;

    // Inject CSS
    const styleTags = cssFiles.map(f => `<style>${f.content}</style>`).join('\n');
    content = content.replace('</head>', `${styleTags}</head>`);

    // Inject JS
    // Note: This is very basic and won't handle modules correctly without a bundler
    // but works for simple script injection
    const scriptTags = jsFiles.map(f => `<script>${f.content}</script>`).join('\n');
    content = content.replace('</body>', `${scriptTags}</body>`);

    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(content);
      doc.close();
    }
  }, [files, refreshTrigger]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="ml-4 px-3 py-1 bg-white rounded-md text-xs text-zinc-500 border border-zinc-200 shadow-sm flex-1 min-w-[200px] text-center font-mono">
            localhost:3000
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-800" onClick={() => iframeRef.current?.contentWindow?.location.reload()}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
      <iframe 
        ref={iframeRef}
        className="flex-1 w-full border-none bg-white"
        title="Preview"
        sandbox="allow-scripts allow-modals allow-same-origin"
      />
    </div>
  );
}
