import { getProduct } from "./data/products.js";

const STORAGE_KEY = "drift:cart:v1";

class Store {
  constructor() {
    this.listeners = new Set();
    this.state = { items: this._load() };
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.items));
    } catch {
      // localStorage unavailable (private mode, quota) — fail silently,
      // cart still works for the current session via in-memory state.
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _emit() {
    this._save();
    this.listeners.forEach((fn) => fn(this.state));
  }

  addItem(productId, qty = 1) {
    const existing = this.state.items.find((i) => i.id === productId);
    if (existing) existing.qty += qty;
    else this.state.items.push({ id: productId, qty });
    this._emit();
  }

  setQty(productId, qty) {
    if (qty <= 0) return this.removeItem(productId);
    const item = this.state.items.find((i) => i.id === productId);
    if (item) {
      item.qty = qty;
      this._emit();
    }
  }

  removeItem(productId) {
    this.state.items = this.state.items.filter((i) => i.id !== productId);
    this._emit();
  }

  clear() {
    this.state.items = [];
    this._emit();
  }

  get lines() {
    return this.state.items
      .map((i) => ({ ...i, product: getProduct(i.id) }))
      .filter((l) => l.product);
  }

  get count() {
    return this.state.items.reduce((sum, i) => sum + i.qty, 0);
  }

  get subtotal() {
    return this.lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  }
}

export const store = new Store();
