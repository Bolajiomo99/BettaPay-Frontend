import React from 'react';
import sanitizeHtml from 'sanitize-html';

/**
 * Renders pre-highlighted syntax-highlighting HTML.
 *
 * The input comes from our own Shiki highlighter (`lib/docs/highlight.ts`), but
 * it still arrives as a raw HTML string, so it is sanitized before it reaches
 * `dangerouslySetInnerHTML`. The allowlist below is scoped to exactly what
 * Shiki emits — `pre`/`code`/`span` with `class` and the `--shiki-*` custom
 * properties that drive the light/dark theme swap in globals.css — and drops
 * everything else, scripts and event handlers included.
 *
 * `sanitize-html` is used rather than DOMPurify because this component is
 * imported by client components (`RequestExample`), and DOMPurify needs a
 * `window`: `isomorphic-dompurify` bridges that with jsdom, which cannot be
 * bundled for the browser and breaks the React Server Components graph.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['pre', 'code', 'span', 'div', 'br', 'a', 'strong', 'em'],
  allowedAttributes: {
    '*': ['class'],
    span: ['class', 'style'],
    pre: ['class', 'style', 'tabindex'],
    code: ['class', 'style'],
    div: ['class', 'style'],
    a: ['href', 'title'],
  },
  // Shiki's dual-theme output puts the light/dark colours in custom properties.
  allowedStyles: {
    '*': {
      '--shiki-light': [/^[^;{}()]+$/],
      '--shiki-dark': [/^[^;{}()]+$/],
      color: [/^#[0-9a-fA-F]{3,8}$/],
      'background-color': [/^#[0-9a-fA-F]{3,8}$/],
      display: [/^inline$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // No tag in the allowlist needs rewriting, and stripping comments keeps the
  // payload identical to what Shiki produced.
  disallowedTagsMode: 'discard',
};

interface SafeHtmlRendererProps extends React.HTMLAttributes<HTMLDivElement> {
  html: string;
}

export function SafeHtmlRenderer({ html, ...props }: SafeHtmlRendererProps) {
  const sanitizedHtml = sanitizeHtml(html, SANITIZE_OPTIONS);

  return (
    <div
      {...props}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
