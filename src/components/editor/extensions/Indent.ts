import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      setIndent: (attributes: { textIndent?: number; paddingLeft?: number; paddingRight?: number }) => ReturnType;
    };
  }
}

export const Indent = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          textIndent: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const v = element.style.textIndent;
              return v ? parseInt(v) : null;
            },
            renderHTML: (attributes: Record<string, unknown>) => {
              if (!attributes.textIndent) return {};
              return { style: `text-indent: ${attributes.textIndent}px` };
            },
          },
          paddingLeft: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const v = element.style.paddingLeft;
              return v ? parseInt(v) : null;
            },
            renderHTML: (attributes: Record<string, unknown>) => {
              if (!attributes.paddingLeft) return {};
              return { style: `padding-left: ${attributes.paddingLeft}px` };
            },
          },
          paddingRight: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const v = element.style.paddingRight;
              return v ? parseInt(v) : null;
            },
            renderHTML: (attributes: Record<string, unknown>) => {
              if (!attributes.paddingRight) return {};
              return { style: `padding-right: ${attributes.paddingRight}px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setIndent:
        (attributes) =>
        ({ chain }) => {
          return chain()
            .updateAttributes('paragraph', attributes)
            .run();
        },
    };
  },
});
