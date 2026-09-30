/**
 * base-component.js
 * ---------------------------------------------------------
 * Minimal lifecycle contract shared by every Super Admin
 * component. Not a framework — just enough structure so
 * every component.js file in this module looks and behaves
 * the same way: mount → render → bindEvents → destroy.
 *
 * Usage:
 *   class Sidebar extends BaseComponent {
 *     template() { return `<nav>...</nav>` }
 *     bindEvents() { this.$('.logout').addEventListener(...) }
 *   }
 *   new Sidebar(document.getElementById('sidebar-slot')).mount();
 * ---------------------------------------------------------
 */

export class BaseComponent {
  /**
   * @param {HTMLElement} host - the element this component renders into
   * @param {object} props - data passed in from the parent (shell/dashboard)
   */
  constructor(host, props = {}) {
    if (!host) {
      throw new Error(`[BaseComponent] No host element provided for ${this.constructor.name}`);
    }
    this.host = host;
    this.props = props;
    this._listeners = [];   // track so destroy() can clean up
    this._mounted = false;
  }

  /** Override: return an HTML string. Must be implemented by subclass. */
  template() {
    throw new Error(`[${this.constructor.name}] template() not implemented`);
  }

  /** Override: attach event listeners after render. Optional. */
  bindEvents() {}

  /** Override: run after first mount (e.g. fetch data). Optional. */
  onMount() {}

  /** Override: run before destroy (e.g. cancel subscriptions). Optional. */
  onDestroy() {}

  /** Scoped querySelector — always searches within this component's host. */
  $(selector) {
    return this.host.querySelector(selector);
  }

  $all(selector) {
    return this.host.querySelectorAll(selector);
  }

  /** Helper so subclasses don't leak listeners — auto-removed on destroy(). */
  on(el, event, handler, options) {
    if (!el) return;
    el.addEventListener(event, handler, options);
    this._listeners.push({ el, event, handler, options });
  }

  /** Full re-render (used when props change, e.g. theme toggle, live data). */
  render() {
    this.host.innerHTML = this.template();
    this.bindEvents();
  }

  mount() {
    this.render();
    this._mounted = true;
    this.onMount();
    return this;
  }

  /** Merge new props and re-render. */
  update(nextProps = {}) {
    this.props = { ...this.props, ...nextProps };
    this.render();
  }

  destroy() {
    this.onDestroy();
    this._listeners.forEach(({ el, event, handler, options }) => {
      el.removeEventListener(event, handler, options);
    });
    this._listeners = [];
    this.host.innerHTML = '';
    this._mounted = false;
  }
}

/** Tiny pub/sub so sibling components (sidebar ↔ shell ↔ topbar) can talk
 *  without direct references. Kept in the same file since it's a one-liner
 *  concern, not a separate architectural layer. */
export const busEvents = new EventTarget();

export function emit(name, detail) {
  busEvents.dispatchEvent(new CustomEvent(name, { detail }));
}

export function listen(name, handler) {
  busEvents.addEventListener(name, handler);
  return () => busEvents.removeEventListener(name, handler);
}
