// components/editor/nodes/ImageNode.tsx
import { DecoratorNode, DOMConversionMap, DOMConversionOutput, DOMExportOutput, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { ReactNode } from 'react';
import React from 'react'; // Add React import

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: number;
    height?: number;
    maxWidth?: number;
    showCaption?: boolean;
    caption?: string;
    mediaId?: string;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<ReactNode> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;
  __maxWidth?: number;
  __showCaption: boolean;
  __caption: string;
  __mediaId?: string;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__maxWidth,
      node.__showCaption,
      node.__caption,
      node.__mediaId,
      node.__key,
    );
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    maxWidth?: number,
    showCaption?: boolean,
    caption?: string,
    mediaId?: string,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
    this.__maxWidth = maxWidth;
    this.__showCaption = showCaption || false;
    this.__caption = caption || '';
    this.__mediaId = mediaId;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const node = $createImageNode(
      serializedNode.src,
      serializedNode.altText,
      serializedNode.width,
      serializedNode.height,
      serializedNode.maxWidth,
      serializedNode.showCaption,
      serializedNode.caption,
      serializedNode.mediaId,
    );
    return node;
  }

  exportJSON(): SerializedImageNode {
    return {
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
      caption: this.__caption,
      mediaId: this.__mediaId,
      type: 'image',
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    if (this.__width) {
      element.setAttribute('width', this.__width.toString());
    }
    if (this.__height) {
      element.setAttribute('height', this.__height.toString());
    }
    if (this.__maxWidth) {
      element.style.maxWidth = `${this.__maxWidth}px`;
    }
    element.className = 'editor-image';

    // If there's a caption, wrap in figure
    if (this.__showCaption && this.__caption) {
      const figure = document.createElement('figure');
      figure.appendChild(element);
      const figcaption = document.createElement('figcaption');
      figcaption.textContent = this.__caption;
      figure.appendChild(figcaption);
      return { element: figure };
    }

    return { element };
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  setSrcAndAltText(src: string, altText: string): void {
    const writable = this.getWritable();
    writable.__src = src;
    writable.__altText = altText;
  }

  getWidth(): number | undefined {
    return this.__width;
  }

  getHeight(): number | undefined {
    return this.__height;
  }

  getMediaId(): string | undefined {
    return this.__mediaId;
  }

  setMediaId(mediaId: string): void {
    const writable = this.getWritable();
    writable.__mediaId = mediaId;
  }

  decorate(): ReactNode {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        showCaption={this.__showCaption}
        caption={this.__caption}
        nodeKey={this.__key}
      />
    );
  }
}

function convertImageElement(domNode: Node): DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { src, alt, width, height } = domNode;
    const node = $createImageNode(src, alt, width, height);
    return { node };
  }
  return { node: null };
}

export function $createImageNode(
  src: string,
  altText: string,
  width?: number,
  height?: number,
  maxWidth?: number,
  showCaption?: boolean,
  caption?: string,
  mediaId?: string,
): ImageNode {
  return new ImageNode(
    src,
    altText,
    width,
    height,
    maxWidth,
    showCaption,
    caption,
    mediaId,
  );
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

// Image Component for React
function ImageComponent({
  src,
  altText,
  width,
  height,
  maxWidth,
  showCaption,
  caption,
  nodeKey,
}: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  showCaption?: boolean;
  caption?: string;
  nodeKey: NodeKey;
}) {
  const style: React.CSSProperties = {};
  if (maxWidth) {
    style.maxWidth = `${maxWidth}px`;
  }

  const image = (
    <img
      src={src}
      alt={altText}
      width={width}
      height={height}
      style={style}
      className="editor-image max-w-full h-auto rounded"
      draggable="false"
    />
  );

  if (showCaption && caption) {
    return (
      <figure className="my-4" data-lexical-image-key={nodeKey}>
        {image}
        <figcaption className="text-sm text-gray-600 text-center mt-2">
          {caption}
        </figcaption>
      </figure>
    );
  }

  return (
    <div className="my-4" data-lexical-image-key={nodeKey}>
      {image}
    </div>
  );
}