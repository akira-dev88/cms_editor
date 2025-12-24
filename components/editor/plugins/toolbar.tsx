'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from 'lexical';
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import {
  $createHeadingNode,
  $createQuoteNode,
} from '@lexical/rich-text';
import {
  TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import {
  $setBlocksType,
} from '@lexical/selection';
import { useCallback } from 'react';

// Define the types for the commands
type TextFormatType = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';
type ElementFormatType = 'left' | 'center' | 'right' | 'justify';

export default function Toolbar() {
  const [editor] = useLexicalComposerContext();

  const handleButtonClick = (command: Function, ...args: any[]) => {
    // Focus editor first
    editor.focus();
    // Execute command
    if (args.length > 0) {
      command(...args);
    } else {
      command();
    }
  };

  // Text formatting handler
  const formatText = (format: TextFormatType) => {
    editor.focus();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  // Element formatting handler
  const formatElement = (align: ElementFormatType) => {
    editor.focus();
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align);
  };

  // Heading formatting
  const formatHeading = (tag: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  };

  // Paragraph formatting
  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  // Quote formatting
  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  // Link insertion
  const insertLink = () => {
    editor.focus();
    const url = prompt('Enter URL');
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  // Fixed list functions that work properly
  const insertBulletList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Make sure we have content to convert to list
        if (!selection.isCollapsed()) {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else {
          // If selection is collapsed, insert a list item
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }
      }
    });
  };

  const insertNumberedList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Make sure we have content to convert to list
        if (!selection.isCollapsed()) {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        } else {
          // If selection is collapsed, insert a list item
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }
      }
    });
  };

  const removeList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
      {/* History */}
      <button
        type="button"
        onClick={() => handleButtonClick(() => editor.dispatchCommand(UNDO_COMMAND, undefined))}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Undo"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => handleButtonClick(() => editor.dispatchCommand(REDO_COMMAND, undefined))}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Redo"
      >
        Redo
      </button>

      <span className="mx-2 border-l border-gray-300" />

      {/* Text formatting */}
      <button
        type="button"
        onClick={() => formatText('bold')}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors font-bold"
        title="Bold"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => formatText('italic')}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors italic"
        title="Italic"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => formatText('underline')}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors underline"
        title="Underline"
      >
        U
      </button>
      <button
        type="button"
        onClick={() => formatText('strikethrough')}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors line-through"
        title="Strikethrough"
      >
        S
      </button>
      <button
        type="button"
        onClick={() => formatText('code')}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors font-mono"
        title="Code"
      >
        {'</>'}
      </button>

      <span className="mx-2 border-l border-gray-300" />

      {/* Headings */}
      <button
        type="button"
        onClick={() => handleButtonClick(formatHeading, 'h1')}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => handleButtonClick(formatHeading, 'h2')}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => handleButtonClick(formatHeading, 'h3')}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Heading 3"
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => handleButtonClick(formatParagraph)}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Normal Paragraph"
      >
        P
      </button>

      <span className="mx-2 border-l border-gray-300" />

      {/* Lists - FIXED */}
      <button
        type="button"
        onClick={insertBulletList}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Bulleted List"
      >
        • List
      </button>
      <button
        type="button"
        onClick={insertNumberedList}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Numbered List"
      >
        1. List
      </button>
      <button
        type="button"
        onClick={removeList}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Remove List Formatting"
      >
        Clear List
      </button>

      <span className="mx-2 border-l border-gray-300" />

      {/* Blocks */}
      <button
        type="button"
        onClick={() => handleButtonClick(formatQuote)}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Quote"
      >
        Quote
      </button>

      <button
        type="button"
        onClick={insertLink}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Insert Link"
      >
        Link
      </button>

      <span className="mx-2 border-l border-gray-300" />

      {/* Alignment */}
      <button
        type="button"
        onClick={() => formatElement('left')}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Align Left"
      >
        L
      </button>
      <button
        type="button"
        onClick={() => formatElement('center')}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Align Center"
      >
        C
      </button>
      <button
        type="button"
        onClick={() => formatElement('right')}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Align Right"
      >
        R
      </button>
      <button
        type="button"
        onClick={() => formatElement('justify')}
        className="px-2 py-1 rounded hover:bg-gray-200 hover:shadow-sm transition-colors"
        title="Justify"
      >
        J
      </button>
    </div>
  );
}