'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
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
}

const editorConfig = {
  namespace: 'ContentEditor',
  theme: {
    heading: {
      h1: 'text-3xl font-bold',
      h2: 'text-2xl font-bold',
      h3: 'text-xl font-bold',
    },
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
    },
  },
  onError(error: Error) {
    console.error(error);
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    AutoLinkNode,
  ],
};

export default function LexicalEditor({
  onChange,
  placeholder = 'Start writing...',
}: Props) {

  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditorType) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor);
        const plainText = editor.getRootElement()?.innerText || '';

        onChange?.({
          lexical: editorState.toJSON(),
          html,
          plainText,
        });
      });
    },
    [onChange]
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <LexicalComposer initialConfig={editorConfig}>
        <Toolbar />

        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-75 p-4 outline-none" />
          }
          placeholder={
            <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />

        <AutoLinkPlugin matchers={[]} />

        <OnChangePlugin onChange={handleChange} />
      </LexicalComposer>
    </div>
  );
}
