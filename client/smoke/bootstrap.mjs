/**
 * Smoke-test bootstrap.
 *
 * The jsdom globals (window, document, event support) MUST exist before React
 * and the app modules are evaluated, because React decides at module-load time
 * whether the browser supports `input` events. That is why the actual test lives
 * in a separate file which is imported dynamically, after the setup below.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true,
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.navigator = dom.window.navigator;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.__JSDOM__ = dom;

// jsdom's Element.prototype lacks the legacy IE methods React still checks for,
// and does not expose the `oninput` handler property React probes.
Object.defineProperty(dom.window.Document.prototype, 'oninput', { value: null, writable: true, configurable: true });
dom.window.Element.prototype.attachEvent ??= function attachEvent() {};
dom.window.Element.prototype.detachEvent ??= function detachEvent() {};
dom.window.scrollTo = () => {};
dom.window.matchMedia ??= () => ({
  matches: false,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
});
globalThis.ResizeObserver = dom.window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

await import('./render.jsx');
