// components/editor/nodes/image-node.ts
import { DecoratorNode, LexicalNode, NodeKey, EditorConfig, SerializedLexicalNode } from 'lexical';
import { JSX } from 'react/jsx-runtime';

export type SerializedImageNode = SerializedLexicalNode & {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  type: 'image';
};

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number;
  __height: number;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({
      src: serializedNode.src,
      altText: serializedNode.altText,
      width: serializedNode.width,
      height: serializedNode.height,
    });
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width || 400;
    this.__height = height || 300;
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'editor-image-container';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        width={this.__width}
        height={this.__height}
        className="editor-image"
        draggable="false"
      />
    );
  }

  // Required LexicalNode methods
  getType(): string {
    return 'image';
  }

  isInline(): boolean {
    return false;
  }

  // Custom methods
  setWidthAndHeight(width: number, height: number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }
}

export function $createImageNode(payload: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  key?: NodeKey;
}): ImageNode {
  return new ImageNode(
    payload.src,
    payload.altText,
    payload.width,
    payload.height,
    payload.key,
  );
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}