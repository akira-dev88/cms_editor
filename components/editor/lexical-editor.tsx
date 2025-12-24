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

import { EditorState, LexicalEditor as LexicalEditorType } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { useCallback } from 'react';

import Toolbar from './plugins/toolbar';

interface Props {
  onChange?: (data: {
    lexical: any;
    html: string;
    plainText: string;
  }) => void;
  placeholder?: string;
  initialValue?: any;
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
  ],
};

export default function LexicalEditor({
  onChange,
  placeholder = 'Start writing...',
  initialValue,
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
      <LexicalComposer initialConfig={{ ...editorConfig, editorState: initialValue }}>
        <div className="border-b">
          <Toolbar />
        </div>

        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="min-h-[300px] p-4 outline-none focus:outline-none"
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