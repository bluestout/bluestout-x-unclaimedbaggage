import { JSX } from 'preact';

type ShopifyElement = JSX.HTMLAttributes<HTMLElement> & Record<string, unknown>;

declare module 'preact/src/jsx' {
  namespace JSXInternal {
    interface IntrinsicElements {
      's-box': ShopifyElement;
      's-stack': ShopifyElement;
      's-section': ShopifyElement;
      's-text': ShopifyElement;
      's-button': ShopifyElement;
      's-spinner': ShopifyElement;
      's-product-thumbnail': ShopifyElement;
    }
  }
}
