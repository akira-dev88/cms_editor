// components/editor/plugins/images-plugin.tsx
'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';
import { JSX, useEffect } from 'react';
import { $createImageNode, ImageNode } from '../nodes/image-node';
export type InsertImagePayload = {
  src: string
  altText: string
  width?: number
  height?: number
}

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND")

export default function ImagesPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagesPlugin: ImageNode not registered on editor")
    }

    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createImageNode(payload)

        $insertNodes([imageNode])

        const parent = imageNode.getParent()
        if (parent && $isRootOrShadowRoot(parent)) {
          $wrapNodeInElement(imageNode, $createParagraphNode)
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])

  return null
}