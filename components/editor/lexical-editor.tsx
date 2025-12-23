// components/editor/lexical-editor.tsx
'use client';

import { useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { EditorState } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';

// Toolbar Component
function Toolbar() {
  const [editor] = useLexicalComposerContext();
  
  const formatText = (format: string) => {
    editor.update(() => {
      // Formatting logic would go here
      console.log('Format:', format);
    });
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b">
      <button
        type="button"
        className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        onClick={() => formatText('bold')}
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        onClick={() => formatText('italic')}
      >
        <em>I</em>
      </button>
      <button
        type="button"
        className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        onClick={() => formatText('underline')}
      >
        U
      </button>
      <button
        type="button"
        className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        onClick={() => {
          editor.update(() => {
            // Insert heading logic
            console.log('Heading');
          });
        }}
      >
        H1
      </button>
      <button
        type="button"
        className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        onClick={() => {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }}
      >
        • List
      </button>
      <button
        type="button"
        className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        onClick={() => {
          // Link logic
          const url = prompt('Enter URL:');
          if (url) {
            console.log('Insert link:', url);
          }
        }}
      >
        🔗 Link
      </button>
    </div>
  );
}

// Error Boundary
function EditorErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Theme
const editorTheme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'my-2',
  placeholder: 'text-gray-400',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
};

// On Error
function onError(error: Error) {
  console.error('Lexical Editor Error:', error);
}

export interface LexicalEditorProps {
  value?: any;
  onChange?: (editorState: EditorState) => void;
  placeholder?: string;
}

export default function LexicalEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
}: LexicalEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create safe initial state
  const getInitialState = () => {
    if (!value) {
      return undefined;
    }
    
    // If it's already a Lexical JSON object
    if (value.root && value.root.type === 'root') {
      return value;
    }
    
    // If it's an EditorState (shouldn't happen)
    if (typeof value.toJSON === 'function') {
      return value.toJSON();
    }
    
    return undefined;
  };

  const initialConfig = {
    namespace: 'CMS Editor',
    theme: editorTheme,
    onError,
    editorState: getInitialState(),
    nodes: [HeadingNode, ListNode, ListItemNode, QuoteNode, LinkNode],
  };

  if (!isMounted) {
    return (
      <div className="border rounded-lg min-h-50 p-4 bg-gray-50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="min-h-50 p-4 outline-none" 
              />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={EditorErrorBoundary}
          />
          {onChange && (
            <OnChangePlugin 
              onChange={onChange} 
              ignoreSelectionChange={true}
            />
          )}
          <HistoryPlugin />
          <LinkPlugin />
          <ListPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}