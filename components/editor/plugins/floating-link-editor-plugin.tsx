// components/editor/plugins/floating-link-editor-plugin.tsx
'use client';

import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isAtNodeEnd } from '@lexical/selection';
import { $getSelection, $isRangeSelection, LexicalEditor } from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';

function getSelectedNode(selection: any) {
    const anchor = selection.anchor;
    const focus = selection.focus;
    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();
    if (anchorNode === focusNode) {
        return anchorNode;
    }
    const isBackward = selection.isBackward();
    if (isBackward) {
        return $isAtNodeEnd(focus) ? anchorNode : focusNode;
    } else {
        return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
    }
}

function positionEditorElement(editorElem: HTMLElement, rect: DOMRect | null) {
    if (rect === null) {
        editorElem.style.opacity = '0';
        editorElem.style.top = '-1000px';
        editorElem.style.left = '-1000px';
    } else {
        editorElem.style.opacity = '1';
        editorElem.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
        editorElem.style.left = `${rect.left + window.pageXOffset - editorElem.offsetWidth / 2 + rect.width / 2
            }px`;
    }
}

function FloatingLinkEditor({
    editor,
    anchorElem,
}: {
    editor: LexicalEditor
    anchorElem: HTMLElement
}) {
    const editorRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const [linkUrl, setLinkUrl] = React.useState("")
    const [isEditMode, setEditMode] = React.useState(false)
    const [lastSelection, setLastSelection] = React.useState<any>(null)

    const updateLinkEditor = React.useCallback(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection)
            const parent = node.getParent()

            if ($isLinkNode(parent)) {
                setLinkUrl(parent.getURL())
            } else if ($isLinkNode(node)) {
                setLinkUrl(node.getURL())
            } else {
                setLinkUrl("")
            }
        }

        const editorElem = editorRef.current
        const nativeSelection = window.getSelection()

        if (!editorElem || !nativeSelection) return

        const rootElement = editor.getRootElement()
        if (
            selection &&
            rootElement &&
            rootElement.contains(nativeSelection.anchorNode)
        ) {
            const domRange = nativeSelection.getRangeAt(0)
            const rect = domRange.getBoundingClientRect()

            positionEditorElement(editorElem, rect)
            setLastSelection(selection)
        } else {
            positionEditorElement(editorElem, null)
            setLastSelection(null)
            setEditMode(false)
            setLinkUrl("")
        }
    }, [editor])

    React.useEffect(() => {
        return editor.registerUpdateListener(() => {
            editor.getEditorState().read(updateLinkEditor)
        })
    }, [editor, updateLinkEditor])

    React.useEffect(() => {
        if (isEditMode) inputRef.current?.focus()
    }, [isEditMode])

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault()
            if (lastSelection && linkUrl) {
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl)
            }
            setEditMode(false)
        }

        if (event.key === "Escape") {
            event.preventDefault()
            setEditMode(false)
        }
    }

    return (
        <div ref={editorRef} className="link-editor">
            {isEditMode ? (
                <input
                    ref={inputRef}
                    className="link-input"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={() => {
                        setEditMode(false)
                        if (lastSelection) {
                            editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl)
                        }
                    }}
                />
            ) : (
                <div className="link-input">
                    <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                        {linkUrl}
                    </a>
                    <button
                        className="link-edit"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setEditMode(true)}
                    />
                </div>
            )}
        </div>
    )
}
export default function FloatingLinkEditorPlugin({
    anchorElem = document.body,
}: {
    anchorElem?: HTMLElement
}): React.JSX.Element | null {
    const [editor] = useLexicalComposerContext()
    const portalRef = React.useRef<HTMLDivElement | null>(null)

    if (!portalRef.current) {
        portalRef.current = document.createElement("div")
    }

    React.useEffect(() => {
        const portalElem = portalRef.current!
        anchorElem.appendChild(portalElem)

        return () => {
            anchorElem.removeChild(portalElem)
        }
    }, [anchorElem])

    return createPortal(
        <FloatingLinkEditor editor={editor} anchorElem={anchorElem} />,
        portalRef.current
    )
}
