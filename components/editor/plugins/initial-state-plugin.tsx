'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

interface InitialStatePluginProps {
  initialValue?: any;
}

export default function InitialStatePlugin({ initialValue }: InitialStatePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (initialValue && editor) {
      // Clear the editor first
      editor.update(() => {
        const root = editor.getRootElement();
        if (root) {
          root.innerHTML = '';
        }
      });

      // Parse the initial value if it's a string
      try {
        const parsedValue = typeof initialValue === 'string' 
          ? JSON.parse(initialValue) 
          : initialValue;
        
        if (parsedValue && typeof parsedValue === 'object') {
          // Create an editor state from the parsed value
          const editorState = editor.parseEditorState(parsedValue);
          editor.setEditorState(editorState);
          console.log('✅ Initial state loaded:', parsedValue);
        }
      } catch (error) {
        console.error('❌ Failed to parse initial value:', error);
      }
    }
  }, [editor, initialValue]);

  return null;
}