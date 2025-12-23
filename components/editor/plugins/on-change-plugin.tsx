// components/editor/plugins/on-change-plugin.tsx
'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $convertToMarkdownString } from '@lexical/markdown';
import { useEffect } from 'react';
import { EditorState } from 'lexical';
import { TRANSFORMERS } from '@lexical/markdown';

interface OnChangePluginProps {
  onChange?: (editorState: EditorState, html: string, markdown: string) => void;
  ignoreHistoryMergeTagChange?: boolean;
  ignoreSelectionChange?: boolean;
}

export function OnChangePlugin({
  onChange,
  ignoreHistoryMergeTagChange = true,
  ignoreSelectionChange = false,
}: OnChangePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(
      ({ editorState, prevEditorState, dirtyElements, dirtyLeaves, tags }) => {
        if (
          onChange &&
          (ignoreSelectionChange || !dirtyElements && !dirtyLeaves) &&
          (!ignoreHistoryMergeTagChange || !tags.has('history-merge'))
        ) {
          editorState.read(() => {
            const html = $generateHtmlFromNodes(editor);
            const markdown = $convertToMarkdownString(TRANSFORMERS);
            onChange(editorState, html, markdown);
          });
        }
      }
    );
  }, [editor, ignoreHistoryMergeTagChange, ignoreSelectionChange, onChange]);

  return null;
}