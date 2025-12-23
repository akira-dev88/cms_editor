// components/editor/simple-editor.tsx
'use client';

import { useState } from 'react';

interface SimpleEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function SimpleEditor({
  value = '',
  onChange,
  placeholder = 'Start writing your content...',
}: SimpleEditorProps) {
  const [content, setContent] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const insertFormat = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
      setContent(newText);
      if (onChange) onChange(newText);
      
      // Focus back and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          end + before.length
        );
      }, 0);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-2 border-b flex flex-wrap gap-1">
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
          onClick={() => insertFormat('**', '**')}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
          onClick={() => insertFormat('*', '*')}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
          onClick={() => insertFormat('# ', '')}
        >
          H1
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
          onClick={() => insertFormat('- ', '')}
        >
          List
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) {
              const text = prompt('Enter link text:', 'Link');
              insertFormat(`[${text || 'Link'}](${url})`);
            }
          }}
        >
          Link
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
          onClick={() => insertFormat('> ', '')}
        >
          Quote
        </button>
      </div>
      <textarea
        className="w-full min-h-75 p-4 outline-none resize-y font-sans text-base"
        placeholder={placeholder}
        value={content}
        onChange={handleChange}
        spellCheck="true"
      />
      <div className="bg-gray-50 p-2 border-t text-xs text-gray-500">
        Supports: **bold**, *italic*, # heading, - list, &gt; quote, [text](url)
      </div>
    </div>
  );
}