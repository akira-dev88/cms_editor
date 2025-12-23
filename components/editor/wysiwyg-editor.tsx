// components/editor/wysiwyg-editor.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface WysiwygEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function WysiwygEditor({
  value = '',
  onChange,
  placeholder = 'Start writing your content...',
}: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [headingLevel, setHeadingLevel] = useState<number | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // Initialize editor with value
  useEffect(() => {
    if (editorRef.current) {
      if (value) {
        editorRef.current.innerHTML = value;
        setShowPlaceholder(false);
      } else {
        setShowPlaceholder(true);
      }
    }
  }, []);

  // Update placeholder visibility based on content
  useEffect(() => {
    if (editorRef.current) {
      const hasContent = editorRef.current.innerHTML.trim().length > 0;
      setShowPlaceholder(!hasContent);
    }
  }, [value]);

  // Set up input listener
  useEffect(() => {
    if (editorRef.current && onChange) {
      const handleInput = () => {
        if (editorRef.current) {
          const content = editorRef.current.innerHTML;
          onChange(content);
          
          // Update placeholder visibility
          const hasContent = content.trim().length > 0;
          setShowPlaceholder(!hasContent);
        }
      };
      
      const editor = editorRef.current;
      editor.addEventListener('input', handleInput);
      
      return () => {
        editor.removeEventListener('input', handleInput);
      };
    }
  }, [onChange]);

  // Execute formatting commands with better handling
  const execCommand = (command: string, value?: string) => {
    try {
      // Focus the editor first
      focusEditor();
      
      // Execute the command
      const success = document.execCommand(command, false, value);
      
      if (!success) {
        console.warn(`Command ${command} failed to execute`);
        
        // Try alternative approach for certain commands
        if (command === 'formatBlock') {
          // For formatBlock, try creating element manually
          formatBlockManually(value);
        }
      }
      
      updateToolbar();
    } catch (error) {
      console.error(`Error executing command ${command}:`, error);
    }
  };

  // Manual formatBlock implementation
  const formatBlockManually = (tagName?: string) => {
    if (!editorRef.current || !tagName) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const selectedContent = range.extractContents();
    
    // Create the new element
    const newElement = document.createElement(tagName);
    newElement.appendChild(selectedContent);
    
    // Insert the new element
    range.insertNode(newElement);
    
    // Move cursor inside the new element
    const newRange = document.createRange();
    newRange.setStartAfter(newElement);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  };

  // Focus editor after command
  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      // Ensure cursor is at the end if there's content
      if (editorRef.current.innerHTML.trim()) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(editorRef.current);
        range.collapse(false); // Collapse to end
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  };

  // Update toolbar state based on selection
  const updateToolbar = () => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const parentElement = range.commonAncestorContainer.parentElement;
    
    if (!parentElement) return;

    // Check formatting in parent hierarchy
    let current: HTMLElement | null = parentElement;
    let bold = false;
    let italic = false;
    let underline = false;
    let heading: number | null = null;

    while (current && current !== editorRef.current) {
      const tagName = current.tagName.toLowerCase();
      
      if (tagName === 'strong' || tagName === 'b') {
        bold = true;
      }
      if (tagName === 'em' || tagName === 'i') {
        italic = true;
      }
      if (tagName === 'u') {
        underline = true;
      }
      if (tagName.match(/^h[1-6]$/)) {
        const level = parseInt(tagName.charAt(1));
        heading = level;
      }
      current = current.parentElement;
    }

    setIsBold(bold);
    setIsItalic(italic);
    setIsUnderline(underline);
    setHeadingLevel(heading);
  };

  // Event handlers
  const handleKeyUp = () => {
    updateToolbar();
  };

  const handleMouseUp = () => {
    setTimeout(updateToolbar, 0);
  };

  const handleClick = () => {
    focusEditor();
  };

  const handleFocus = () => {
    setShowPlaceholder(false);
  };

  const handleBlur = () => {
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      setShowPlaceholder(true);
    }
  };

  // Formatting functions
  const formatHeading = (level: number) => {
    execCommand('formatBlock', `h${level}`);
  };

  const formatParagraph = () => {
    execCommand('formatBlock', 'p');
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertUnorderedList = () => {
    // Try different approaches for list insertion
    try {
      execCommand('insertUnorderedList');
    } catch (error) {
      console.error('Failed to insert unordered list:', error);
      // Fallback: create list manually
      insertListManually('ul');
    }
  };

  const insertOrderedList = () => {
    try {
      execCommand('insertOrderedList');
    } catch (error) {
      console.error('Failed to insert ordered list:', error);
      // Fallback: create list manually
      insertListManually('ol');
    }
  };

  // Manual list insertion
  const insertListManually = (listType: 'ul' | 'ol') => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const listItem = document.createElement('li');
    
    // Get selected text or create empty list item
    if (!range.collapsed) {
      const selectedText = range.extractContents();
      listItem.appendChild(selectedText);
    } else {
      listItem.innerHTML = '&nbsp;'; // Non-breaking space for empty item
    }
    
    // Create list and add item
    const list = document.createElement(listType);
    list.appendChild(listItem);
    
    // Insert the list
    range.insertNode(list);
    
    // Move cursor inside the list item
    const newRange = document.createRange();
    newRange.setStart(listItem, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  };

  const insertQuote = () => {
    execCommand('formatBlock', 'blockquote');
  };

  const clearFormatting = () => {
    try {
      // Try to remove all formatting
      execCommand('removeFormat');
      
      // Also try to unwrap any block elements
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const parent = range.commonAncestorContainer.parentElement;
        
        if (parent && parent !== editorRef.current) {
          // Create a span to hold the content
          const span = document.createElement('span');
          const content = range.extractContents();
          span.appendChild(content);
          
          // Replace the parent with the span
          parent.parentNode?.replaceChild(span, parent);
          
          // Move cursor inside the span
          const newRange = document.createRange();
          newRange.setStart(span, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    } catch (error) {
      console.error('Failed to clear formatting:', error);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 p-2 border-b flex flex-wrap gap-1">
        {/* Text Formatting */}
        <button
          type="button"
          className={`px-3 py-1 text-sm border rounded ${isBold ? 'bg-blue-100 text-blue-700 border-blue-300' : 'hover:bg-gray-100'}`}
          onClick={() => execCommand('bold')}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`px-3 py-1 text-sm border rounded ${isItalic ? 'bg-blue-100 text-blue-700 border-blue-300' : 'hover:bg-gray-100'}`}
          onClick={() => execCommand('italic')}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={`px-3 py-1 text-sm border rounded ${isUnderline ? 'bg-blue-100 text-blue-700 border-blue-300' : 'hover:bg-gray-100'}`}
          onClick={() => execCommand('underline')}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>

        {/* Headings */}
        <div className="h-6 border-l border-gray-300 mx-1"></div>
        <button
          type="button"
          className={`px-3 py-1 text-sm border rounded ${headingLevel === 1 ? 'bg-blue-100 text-blue-700 border-blue-300' : 'hover:bg-gray-100'}`}
          onClick={() => formatHeading(1)}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          className={`px-3 py-1 text-sm border rounded ${headingLevel === 2 ? 'bg-blue-100 text-blue-700 border-blue-300' : 'hover:bg-gray-100'}`}
          onClick={() => formatHeading(2)}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          className={`px-3 py-1 text-sm border rounded ${headingLevel === 3 ? 'bg-blue-100 text-blue-700 border-blue-300' : 'hover:bg-gray-100'}`}
          onClick={() => formatHeading(3)}
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
          onClick={formatParagraph}
          title="Normal Paragraph"
        >
          P
        </button>

        {/* Lists */}
        <div className="h-6 border-l border-gray-300 mx-1"></div>
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
          onClick={insertUnorderedList}
          title="Bulleted List"
        >
          • List
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
          onClick={insertOrderedList}
          title="Numbered List"
        >
          1. List
        </button>

        {/* Other */}
        <div className="h-6 border-l border-gray-300 mx-1"></div>
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
          onClick={insertLink}
          title="Insert Link"
        >
          🔗 Link
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
          onClick={insertQuote}
          title="Insert Quote"
        >
          Quote
        </button>
        <button
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
          onClick={clearFormatting}
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>
      
      {/* Editor Area */}
      <div className="relative">
        {/* Placeholder */}
        {showPlaceholder && (
          <div
            ref={placeholderRef}
            className="absolute top-4 left-4 text-gray-400 pointer-events-none z-10"
            onClick={focusEditor}
          >
            {placeholder}
          </div>
        )}
        
        {/* Editor */}
        <div
          ref={editorRef}
          className="w-full min-h-75 p-4 outline-none resize-y font-sans text-base bg-white relative z-20"
          contentEditable
          onKeyUp={handleKeyUp}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onFocus={handleFocus}
          onBlur={handleBlur}
          suppressContentEditableWarning
          style={{ 
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            minHeight: '300px',
            lineHeight: '1.6'
          }}
        />
      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 p-2 border-t text-xs text-gray-500 flex justify-between">
        <span>WYSIWYG Editor - Formatting is applied directly</span>
        <span>Click anywhere in the editor to start typing</span>
      </div>
    </div>
  );
}