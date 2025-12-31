// components/editor/plugins/images-plugin.tsx
'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement } from '@lexical/utils';
import {
  $createParagraphNode,
  $getSelection,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from 'lexical';
import { useEffect } from 'react';
import { $createImageNode, ImageNode } from '../nodes/ImageNode';

export type InsertImagePayload = {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  showCaption?: boolean;
  caption?: string;
  mediaId?: string;
};

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND");

export default function ImagesPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagesPlugin: ImageNode not registered on editor");
    }

    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload: InsertImagePayload) => {
        // FIX: Pass individual arguments instead of the whole object
        const imageNode = $createImageNode(
          payload.src,
          payload.altText || '', // Provide default alt text
          payload.width,
          payload.height,
          payload.maxWidth,
          payload.showCaption,
          payload.caption,
          payload.mediaId
        );

        $insertNodes([imageNode]);

        const parent = imageNode.getParent();
        if (parent && $isRootOrShadowRoot(parent)) {
          $wrapNodeInElement(imageNode, $createParagraphNode);
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}