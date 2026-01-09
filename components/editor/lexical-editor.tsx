// components/editor/lexical-editor.tsx
'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ImageNode } from './nodes/ImageNode';

import {
  HeadingNode,
  QuoteNode,
} from '@lexical/rich-text';
import {
  ListNode,
  ListItemNode,
} from '@lexical/list';
import {
  LinkNode,
  AutoLinkNode,
} from '@lexical/link';
import { CodeNode } from '@lexical/code';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';

import { EditorState, LexicalEditor as LexicalEditorType, $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import Toolbar from './plugins/toolbar';

interface Props {
  onChange?: (data: {
    lexical: any;
    html: string;
    plainText: string;
  }) => void;
  placeholder?: string;
  initialValue?: any;
  contentId?: string;
  selectedMediaCount?: number;
  onMediaSelect?: (media: any) => void;
}

const editorConfig = {
  namespace: 'ContentEditor',
  theme: {
    heading: {
      h1: 'text-3xl font-bold mt-4 mb-2',
      h2: 'text-2xl font-bold mt-4 mb-2',
      h3: 'text-xl font-bold mt-3 mb-2',
    },
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'line-through',
      code: 'bg-gray-100 font-mono text-sm p-1 rounded',
    },
    paragraph: 'my-2',
    quote: 'border-l-4 border-gray-300 pl-4 italic my-4',
    list: {
      nested: {
        listitem: 'list-none',
      },
      ol: 'list-decimal pl-8 my-2',
      ul: 'list-disc pl-8 my-2',
      listitem: 'my-1',
    },
    link: 'text-blue-600 underline cursor-pointer',
  },
  image: 'editor-image',
  onError(error: Error) {
    console.error('Lexical Editor Error:', error);
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    AutoLinkNode,
    CodeNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    ImageNode,
  ],
};

// Helper function to create a minimal editor state
function createEmptyEditorState() {
  return {
    root: {
      children: [
        {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
          textStyle: '',
          textFormat: 0
        }
      ],
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  };
}

// Helper function to check if lexical state is valid
function isValidLexicalState(state: any): boolean {
  if (!state) return false;
  if (!state.root) return false;
  if (!state.root.children || !Array.isArray(state.root.children)) return false;
  return true;
}

// Add this plugin component
// components/editor/lexical-editor.tsx - Update the InitialContentPlugin

function InitialContentPlugin({ initialValue }: { initialValue?: any }) {
  const [editor] = useLexicalComposerContext();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (editor && !hasLoaded) {
      setHasLoaded(true);

      // Defer the editor state loading to avoid flushSync conflict
      const timer = setTimeout(() => {
        console.log('🔄 InitialContentPlugin running with value:', initialValue);

        let stateToLoad = initialValue;

        // Check if initialValue is valid
        if (!isValidLexicalState(initialValue)) {
          console.log('⚠️ Initial value is not valid, creating empty state');
          stateToLoad = createEmptyEditorState();
        }

        try {
          console.log('📝 Parsing editor state:', stateToLoad);
          const editorState = editor.parseEditorState(stateToLoad);

          // Check if the parsed state is empty
          if (editorState.isEmpty()) {
            console.log('⚠️ Parsed editor state is empty, creating default content');
            // Create a simple paragraph to avoid empty state
            editor.update(() => {
              const root = $getRoot();
              if (root.isEmpty()) {
                const paragraph = $createParagraphNode();
                paragraph.append($createTextNode(''));
                root.append(paragraph);
              }
            });
          } else {
            console.log('✅ Setting editor state');
            // Use requestAnimationFrame to defer the update
            requestAnimationFrame(() => {
              editor.setEditorState(editorState);
            });
          }

          console.log('✅ Initial content loaded successfully');
        } catch (error) {
          console.error('❌ Failed to load initial content:', error);

          // Fallback: Create empty editor state on next frame
          requestAnimationFrame(() => {
            try {
              editor.update(() => {
                const root = $getRoot();
                if (root.isEmpty()) {
                  const paragraph = $createParagraphNode();
                  paragraph.append($createTextNode(''));
                  root.append(paragraph);
                }
              });
              console.log('✅ Created empty editor state as fallback');
            } catch (fallbackError) {
              console.error('❌ Failed to create fallback state:', fallbackError);
            }
          });
        }
      }, 0); // Use setTimeout with 0 delay

      return () => {
        clearTimeout(timer);
      };
    }
  }, [editor, initialValue, hasLoaded]);

  return null;
}

export default function LexicalEditor({
  onChange,
  placeholder = 'Start writing...',
  initialValue,
  contentId,
  selectedMediaCount = 0,
  onMediaSelect,
}: Props) {
  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditorType) => {
      editorState.read(() => {
        try {
          const html = $generateHtmlFromNodes(editor);
          const plainText = editor.getRootElement()?.innerText || '';
          const lexical = editorState.toJSON();

          onChange?.({
            lexical,
            html,
            plainText,
          });
        } catch (error) {
          console.error('Error generating HTML:', error);
        }
      });
    },
    [onChange]
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Always use initialConfig without editorState to avoid conflicts */}
      <LexicalComposer initialConfig={editorConfig}>
        {/* Always render InitialContentPlugin, it will handle empty state */}
        <InitialContentPlugin initialValue={initialValue} />

        <div className="border-b">
          <Toolbar
            contentId={contentId}
            selectedMediaCount={selectedMediaCount}
            onMediaSelect={onMediaSelect}
          />
        </div>

        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-75 p-4 outline-none focus:outline-none"
                aria-label="Editor"
              />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none select-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>

        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <TabIndentationPlugin />
        <OnChangePlugin onChange={handleChange} />
      </LexicalComposer>
    </div>
  );
}