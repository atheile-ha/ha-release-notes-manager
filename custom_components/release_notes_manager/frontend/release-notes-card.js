/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const N = globalThis, V = N.ShadowRoot && (N.ShadyCSS === void 0 || N.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, B = Symbol(), Z = /* @__PURE__ */ new WeakMap();
let le = class {
  constructor(e, t, s) {
    if (this._$cssResult$ = !0, s !== B) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (V && e === void 0) {
      const s = t !== void 0 && t.length === 1;
      s && (e = Z.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && Z.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const me = (r) => new le(typeof r == "string" ? r : r + "", void 0, B), $e = (r, ...e) => {
  const t = r.length === 1 ? r[0] : e.reduce((s, i, n) => s + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + r[n + 1], r[0]);
  return new le(t, r, B);
}, ve = (r, e) => {
  if (V) r.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const s = document.createElement("style"), i = N.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = t.cssText, r.appendChild(s);
  }
}, G = V ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return me(t);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ye, defineProperty: we, getOwnPropertyDescriptor: xe, getOwnPropertyNames: Ae, getOwnPropertySymbols: Ee, getPrototypeOf: ke } = Object, D = globalThis, J = D.trustedTypes, Se = J ? J.emptyScript : "", Ce = D.reactiveElementPolyfillSupport, S = (r, e) => r, H = { toAttribute(r, e) {
  switch (e) {
    case Boolean:
      r = r ? Se : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, e) {
  let t = r;
  switch (e) {
    case Boolean:
      t = r !== null;
      break;
    case Number:
      t = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(r);
      } catch {
        t = null;
      }
  }
  return t;
} }, F = (r, e) => !ye(r, e), X = { attribute: !0, type: String, converter: H, reflect: !1, useDefault: !1, hasChanged: F };
Symbol.metadata ??= Symbol("metadata"), D.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let x = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = X) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(e, s, t);
      i !== void 0 && we(this.prototype, e, i);
    }
  }
  static getPropertyDescriptor(e, t, s) {
    const { get: i, set: n } = xe(this.prototype, e) ?? { get() {
      return this[t];
    }, set(a) {
      this[t] = a;
    } };
    return { get: i, set(a) {
      const o = i?.call(this);
      n?.call(this, a), this.requestUpdate(e, o, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? X;
  }
  static _$Ei() {
    if (this.hasOwnProperty(S("elementProperties"))) return;
    const e = ke(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(S("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(S("properties"))) {
      const t = this.properties, s = [...Ae(t), ...Ee(t)];
      for (const i of s) this.createProperty(i, t[i]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [s, i] of t) this.elementProperties.set(s, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, s] of this.elementProperties) {
      const i = this._$Eu(t, s);
      i !== void 0 && this._$Eh.set(i, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const i of s) t.unshift(G(i));
    } else e !== void 0 && t.push(G(e));
    return t;
  }
  static _$Eu(e, t) {
    const s = t.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const s of t.keys()) this.hasOwnProperty(s) && (e.set(s, this[s]), delete this[s]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ve(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, t, s) {
    this._$AK(e, s);
  }
  _$ET(e, t) {
    const s = this.constructor.elementProperties.get(e), i = this.constructor._$Eu(e, s);
    if (i !== void 0 && s.reflect === !0) {
      const n = (s.converter?.toAttribute !== void 0 ? s.converter : H).toAttribute(t, s.type);
      this._$Em = e, n == null ? this.removeAttribute(i) : this.setAttribute(i, n), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const s = this.constructor, i = s._$Eh.get(e);
    if (i !== void 0 && this._$Em !== i) {
      const n = s.getPropertyOptions(i), a = typeof n.converter == "function" ? { fromAttribute: n.converter } : n.converter?.fromAttribute !== void 0 ? n.converter : H;
      this._$Em = i;
      const o = a.fromAttribute(t, n.type);
      this[i] = o ?? this._$Ej?.get(i) ?? o, this._$Em = null;
    }
  }
  requestUpdate(e, t, s, i = !1, n) {
    if (e !== void 0) {
      const a = this.constructor;
      if (i === !1 && (n = this[e]), s ??= a.getPropertyOptions(e), !((s.hasChanged ?? F)(n, t) || s.useDefault && s.reflect && n === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, s)))) return;
      this.C(e, t, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: s, reflect: i, wrapped: n }, a) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), n !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (t = void 0), this._$AL.set(e, t)), i === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [i, n] of this._$Ep) this[i] = n;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [i, n] of s) {
        const { wrapped: a } = n, o = this[i];
        a !== !0 || this._$AL.has(i) || o === void 0 || this.C(i, void 0, n, o);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(t)) : this._$EM();
    } catch (s) {
      throw e = !1, this._$EM(), s;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
x.elementStyles = [], x.shadowRootOptions = { mode: "open" }, x[S("elementProperties")] = /* @__PURE__ */ new Map(), x[S("finalized")] = /* @__PURE__ */ new Map(), Ce?.({ ReactiveElement: x }), (D.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const W = globalThis, Y = (r) => r, I = W.trustedTypes, Q = I ? I.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, he = "$lit$", m = `lit$${Math.random().toFixed(9).slice(2)}$`, de = "?" + m, Pe = `<${de}>`, w = document, P = () => w.createComment(""), U = (r) => r === null || typeof r != "object" && typeof r != "function", K = Array.isArray, Ue = (r) => K(r) || typeof r?.[Symbol.iterator] == "function", j = `[ 	
\f\r]`, k = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ee = /-->/g, te = />/g, v = RegExp(`>|${j}(?:([^\\s"'>=/]+)(${j}*=${j}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), se = /'/g, ie = /"/g, ce = /^(?:script|style|textarea|title)$/i, pe = (r) => (e, ...t) => ({ _$litType$: r, strings: e, values: t }), d = pe(1), ue = pe(2), A = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), re = /* @__PURE__ */ new WeakMap(), y = w.createTreeWalker(w, 129);
function ge(r, e) {
  if (!K(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Q !== void 0 ? Q.createHTML(e) : e;
}
const Re = (r, e) => {
  const t = r.length - 1, s = [];
  let i, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = k;
  for (let o = 0; o < t; o++) {
    const l = r[o];
    let p, u, c = -1, f = 0;
    for (; f < l.length && (a.lastIndex = f, u = a.exec(l), u !== null); ) f = a.lastIndex, a === k ? u[1] === "!--" ? a = ee : u[1] !== void 0 ? a = te : u[2] !== void 0 ? (ce.test(u[2]) && (i = RegExp("</" + u[2], "g")), a = v) : u[3] !== void 0 && (a = v) : a === v ? u[0] === ">" ? (a = i ?? k, c = -1) : u[1] === void 0 ? c = -2 : (c = a.lastIndex - u[2].length, p = u[1], a = u[3] === void 0 ? v : u[3] === '"' ? ie : se) : a === ie || a === se ? a = v : a === ee || a === te ? a = k : (a = v, i = void 0);
    const _ = a === v && r[o + 1].startsWith("/>") ? " " : "";
    n += a === k ? l + Pe : c >= 0 ? (s.push(p), l.slice(0, c) + he + l.slice(c) + m + _) : l + m + (c === -2 ? o : _);
  }
  return [ge(r, n + (r[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class R {
  constructor({ strings: e, _$litType$: t }, s) {
    let i;
    this.parts = [];
    let n = 0, a = 0;
    const o = e.length - 1, l = this.parts, [p, u] = Re(e, t);
    if (this.el = R.createElement(p, s), y.currentNode = this.el.content, t === 2 || t === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (i = y.nextNode()) !== null && l.length < o; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const c of i.getAttributeNames()) if (c.endsWith(he)) {
          const f = u[a++], _ = i.getAttribute(c).split(m), T = /([.?@])?(.*)/.exec(f);
          l.push({ type: 1, index: n, name: T[2], strings: _, ctor: T[1] === "." ? Te : T[1] === "?" ? Me : T[1] === "@" ? Ne : z }), i.removeAttribute(c);
        } else c.startsWith(m) && (l.push({ type: 6, index: n }), i.removeAttribute(c));
        if (ce.test(i.tagName)) {
          const c = i.textContent.split(m), f = c.length - 1;
          if (f > 0) {
            i.textContent = I ? I.emptyScript : "";
            for (let _ = 0; _ < f; _++) i.append(c[_], P()), y.nextNode(), l.push({ type: 2, index: ++n });
            i.append(c[f], P());
          }
        }
      } else if (i.nodeType === 8) if (i.data === de) l.push({ type: 2, index: n });
      else {
        let c = -1;
        for (; (c = i.data.indexOf(m, c + 1)) !== -1; ) l.push({ type: 7, index: n }), c += m.length - 1;
      }
      n++;
    }
  }
  static createElement(e, t) {
    const s = w.createElement("template");
    return s.innerHTML = e, s;
  }
}
function E(r, e, t = r, s) {
  if (e === A) return e;
  let i = s !== void 0 ? t._$Co?.[s] : t._$Cl;
  const n = U(e) ? void 0 : e._$litDirective$;
  return i?.constructor !== n && (i?._$AO?.(!1), n === void 0 ? i = void 0 : (i = new n(r), i._$AT(r, t, s)), s !== void 0 ? (t._$Co ??= [])[s] = i : t._$Cl = i), i !== void 0 && (e = E(r, i._$AS(r, e.values), i, s)), e;
}
class Oe {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: s } = this._$AD, i = (e?.creationScope ?? w).importNode(t, !0);
    y.currentNode = i;
    let n = y.nextNode(), a = 0, o = 0, l = s[0];
    for (; l !== void 0; ) {
      if (a === l.index) {
        let p;
        l.type === 2 ? p = new O(n, n.nextSibling, this, e) : l.type === 1 ? p = new l.ctor(n, l.name, l.strings, this, e) : l.type === 6 && (p = new He(n, this, e)), this._$AV.push(p), l = s[++o];
      }
      a !== l?.index && (n = y.nextNode(), a++);
    }
    return y.currentNode = w, i;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class O {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, s, i) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = s, this.options = i, this._$Cv = i?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = E(this, e, t), U(e) ? e === h || e == null || e === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : e !== this._$AH && e !== A && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ue(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== h && U(this._$AH) ? this._$AA.nextSibling.data = e : this.T(w.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: s } = e, i = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = R.createElement(ge(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === i) this._$AH.p(t);
    else {
      const n = new Oe(i, this), a = n.u(this.options);
      n.p(t), this.T(a), this._$AH = n;
    }
  }
  _$AC(e) {
    let t = re.get(e.strings);
    return t === void 0 && re.set(e.strings, t = new R(e)), t;
  }
  k(e) {
    K(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, i = 0;
    for (const n of e) i === t.length ? t.push(s = new O(this.O(P()), this.O(P()), this, this.options)) : s = t[i], s._$AI(n), i++;
    i < t.length && (this._$AR(s && s._$AB.nextSibling, i), t.length = i);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const s = Y(e).nextSibling;
      Y(e).remove(), e = s;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class z {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, s, i, n) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = e, this.name = t, this._$AM = i, this.options = n, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = h;
  }
  _$AI(e, t = this, s, i) {
    const n = this.strings;
    let a = !1;
    if (n === void 0) e = E(this, e, t, 0), a = !U(e) || e !== this._$AH && e !== A, a && (this._$AH = e);
    else {
      const o = e;
      let l, p;
      for (e = n[0], l = 0; l < n.length - 1; l++) p = E(this, o[s + l], t, l), p === A && (p = this._$AH[l]), a ||= !U(p) || p !== this._$AH[l], p === h ? e = h : e !== h && (e += (p ?? "") + n[l + 1]), this._$AH[l] = p;
    }
    a && !i && this.j(e);
  }
  j(e) {
    e === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Te extends z {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === h ? void 0 : e;
  }
}
class Me extends z {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== h);
  }
}
class Ne extends z {
  constructor(e, t, s, i, n) {
    super(e, t, s, i, n), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = E(this, e, t, 0) ?? h) === A) return;
    const s = this._$AH, i = e === h && s !== h || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, n = e !== h && (s === h || i);
    i && this.element.removeEventListener(this.name, this, s), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class He {
  constructor(e, t, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    E(this, e);
  }
}
const Ie = W.litHtmlPolyfillSupport;
Ie?.(R, O), (W.litHtmlVersions ??= []).push("3.3.3");
const Le = (r, e, t) => {
  const s = t?.renderBefore ?? e;
  let i = s._$litPart$;
  if (i === void 0) {
    const n = t?.renderBefore ?? null;
    s._$litPart$ = i = new O(e.insertBefore(P(), n), n, void 0, t ?? {});
  }
  return i._$AI(r), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis;
class C extends x {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Le(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return A;
  }
}
C._$litElement$ = !0, C.finalized = !0, q.litElementHydrateSupport?.({ LitElement: C });
const De = q.litElementPolyfillSupport;
De?.({ LitElement: C });
(q.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ze = { attribute: !0, type: String, converter: H, reflect: !1, hasChanged: F }, je = (r = ze, e, t) => {
  const { kind: s, metadata: i } = t;
  let n = globalThis.litPropertyMetadata.get(i);
  if (n === void 0 && globalThis.litPropertyMetadata.set(i, n = /* @__PURE__ */ new Map()), s === "setter" && ((r = Object.create(r)).wrapped = !0), n.set(t.name, r), s === "accessor") {
    const { name: a } = t;
    return { set(o) {
      const l = e.get.call(this);
      e.set.call(this, o), this.requestUpdate(a, l, r, !0, o);
    }, init(o) {
      return o !== void 0 && this.C(a, void 0, r, o), o;
    } };
  }
  if (s === "setter") {
    const { name: a } = t;
    return function(o) {
      const l = this[a];
      e.call(this, o), this.requestUpdate(a, l, r, !0, o);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function fe(r) {
  return (e, t) => typeof t == "object" ? je(r, e, t) : ((s, i, n) => {
    const a = i.hasOwnProperty(n);
    return i.constructor.createProperty(n, s), a ? Object.getOwnPropertyDescriptor(i, n) : void 0;
  })(r, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function $(r) {
  return fe({ ...r, state: !0, attribute: !1 });
}
function Ve(r) {
  return r.callWS({ type: "release_notes_manager/data" });
}
function Be(r, e) {
  return r.connection.subscribeMessage(() => e(), {
    type: "release_notes_manager/subscribe"
  });
}
function Fe(r, e) {
  const t = () => e();
  return r.connection.addEventListener("ready", t), () => r.connection.removeEventListener("ready", t);
}
const We = [
  "white",
  "gray",
  "black",
  "red",
  "orange",
  "yellow",
  "green",
  "blue-light",
  "blue-dark",
  "purple",
  "pink"
], Ke = {
  white: "white",
  gray: "gray",
  slate: "gray",
  zinc: "gray",
  neutral: "gray",
  stone: "gray",
  black: "black",
  red: "red",
  rose: "pink",
  orange: "orange",
  amber: "yellow",
  yellow: "yellow",
  green: "green",
  emerald: "green",
  lime: "green",
  teal: "green",
  sky: "blue-light",
  cyan: "blue-light",
  indigo: "blue-dark",
  violet: "purple",
  purple: "purple",
  fuchsia: "pink",
  pink: "pink"
};
function qe(r) {
  if (We.includes(r ?? ""))
    return r;
  const e = /bg-([a-z]+)(?:-(\d+))?/.exec(r ?? "");
  if (!e)
    return "gray";
  const t = e[1], s = Number.parseInt(e[2] ?? "0", 10);
  return t === "blue" ? s >= 500 ? "blue-dark" : "blue-light" : t === "gray" && s >= 700 ? "black" : Ke[t] ?? "gray";
}
function Ze(r, e) {
  const t = e || "general";
  return r.find((s) => s.id === t) ?? { id: t, label: t, color: "gray" };
}
function Ge(r) {
  if (!r)
    return "";
  const [e, t, s] = r.split("-");
  return `${s}.${t}.${e}`;
}
function Je(r) {
  const e = [...r].sort(
    (t, s) => new Date(s.date).getTime() - new Date(t.date).getTime() || s.id - t.id
  );
  return e.length > 0 ? e[0].id : null;
}
function Xe(r, e, t) {
  const s = e.trim().toLowerCase();
  return r.filter((i) => {
    const n = !s || JSON.stringify(i).toLowerCase().includes(s), a = t === "all" || (i.features ?? []).some((o) => o.category === t) || (i.changes ?? []).some((o) => o.category === t);
    return n && a;
  });
}
function be(r) {
  return (r.knownIssues ?? []).filter((e) => e.status !== "resolved");
}
function _e(r) {
  return (r.knownIssues ?? []).filter(
    (e) => e.status === "resolved" && e.resolvedInVersion === r.version
  );
}
function Ye(r) {
  return {
    features: (r.features ?? []).length,
    changes: (r.changes ?? []).length + _e(r).length,
    issues: be(r).length
  };
}
const Qe = $e`
  :host {
    display: block;
    color: var(--primary-text-color);
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, transparent));
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: var(--ha-card-box-shadow, none);
    overflow: hidden;
    --rn-muted: var(--secondary-text-color);
    --rn-line: var(--divider-color, rgba(127, 127, 127, 0.3));
    --rn-surface: var(--ha-card-background, var(--card-background-color, #fff));
    --rn-accent: var(--primary-color, #03a9f4);
    --rn-head-bg: color-mix(in srgb, var(--primary-text-color, #000) 4%, transparent);
    --rn-success: var(--success-color, #43a047);
    --rn-warning: var(--warning-color, #ffa600);
    --rn-info: var(--info-color, #039be5);

    /* Kategorie-Farben (hell), Kontrast >= 4,5:1 */
    --lbl-white-bg: #ffffff; --lbl-white-fg: #202124; --lbl-white-bd: #bfc3c9;
    --lbl-gray-bg: #e8eaed; --lbl-gray-fg: #3c4043;
    --lbl-black-bg: #2b2d31; --lbl-black-fg: #ffffff;
    --lbl-red-bg: #fde2e1; --lbl-red-fg: #a3221b;
    --lbl-orange-bg: #ffe8d4; --lbl-orange-fg: #9a3d0a;
    --lbl-yellow-bg: #fdf1c4; --lbl-yellow-fg: #6f4a00;
    --lbl-green-bg: #dcf3e3; --lbl-green-fg: #1b6b36;
    --lbl-blue-light-bg: #d6e9fc; --lbl-blue-light-fg: #144f8a;
    --lbl-blue-dark-bg: #1f5fbf; --lbl-blue-dark-fg: #ffffff;
    --lbl-purple-bg: #efe3fb; --lbl-purple-fg: #6a2ba3;
    --lbl-pink-bg: #fce1ee; --lbl-pink-fg: #9b1d57;
  }

  :host([dark]) {
    --lbl-white-bg: transparent; --lbl-white-fg: #f1f3f4; --lbl-white-bd: #6b6f76;
    --lbl-gray-bg: #3a3d42; --lbl-gray-fg: #dfe1e5;
    --lbl-black-bg: #e6e7e9; --lbl-black-fg: #141516;
    --lbl-red-bg: #4a1f1f; --lbl-red-fg: #ffb3ad;
    --lbl-orange-bg: #4a2a14; --lbl-orange-fg: #ffc28f;
    --lbl-yellow-bg: #463a10; --lbl-yellow-fg: #f5d66b;
    --lbl-green-bg: #173d26; --lbl-green-fg: #8fdcaa;
    --lbl-blue-light-bg: #18344f; --lbl-blue-light-fg: #9ccbfa;
    --lbl-blue-dark-bg: #2f6fd0; --lbl-blue-dark-fg: #ffffff;
    --lbl-purple-bg: #362151; --lbl-purple-fg: #d7b8fb;
    --lbl-pink-bg: #4a1b33; --lbl-pink-fg: #ffb0d4;
  }

  * {
    box-sizing: border-box;
  }

  button,
  input,
  select {
    font: inherit;
    color: inherit;
  }

  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  [role="button"]:focus-visible {
    outline: 2px solid var(--rn-accent);
    outline-offset: 2px;
  }

  .muted {
    color: var(--rn-muted);
  }

  /* Kopf */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 8px 8px 16px;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 1.15em;
    font-weight: 500;
  }

  .title svg {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
  }

  .icon {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--rn-muted);
    cursor: pointer;
  }

  .icon:hover {
    background: var(--rn-head-bg);
    color: var(--primary-text-color);
  }

  .icon svg {
    width: 20px;
    height: 20px;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 16px 12px;
  }

  .filters input {
    flex: 1 1 10rem;
    min-width: 0;
  }

  input,
  select {
    padding: 6px 10px;
    background: var(--rn-surface);
    border: 1px solid var(--rn-line);
    border-radius: 8px;
  }

  input::placeholder {
    color: var(--rn-muted);
  }

  button.text {
    padding: 6px 14px;
    background: transparent;
    border: 1px solid var(--rn-accent);
    border-radius: 8px;
    color: var(--rn-accent);
    cursor: pointer;
  }

  /* Releases */
  .releases {
    border-top: 1px solid var(--rn-line);
  }

  .release + .release {
    border-top: 1px solid var(--rn-line);
  }

  .release-head {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 44px 12px 16px;
    cursor: pointer;
  }

  .release-head::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 18px;
    width: 7px;
    height: 7px;
    margin-top: -6px;
    border-right: 2px solid var(--rn-muted);
    border-bottom: 2px solid var(--rn-muted);
    transform: rotate(45deg);
  }

  .release.open .release-head::after {
    margin-top: -2px;
    transform: rotate(-135deg);
  }

  .release-title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 12px;
  }

  .release-title {
    margin: 0;
    min-width: 0;
    font-size: 1.05em;
    font-weight: 500;
    overflow-wrap: anywhere;
  }

  .release-date {
    color: var(--rn-muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .release-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px 16px 16px;
    border-top: 1px solid var(--rn-line);
    background: var(--rn-head-bg);
  }

  .group-title {
    margin: 10px 0 4px;
    color: var(--rn-muted);
    font-size: 0.75em;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .items > li + li {
    border-top: 1px solid var(--rn-line);
  }

  .items.issues {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .items.issues > li + li {
    border-top: 0;
  }

  .item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 0;
  }

  .item.issue {
    padding: 8px 10px;
    border: 1px solid color-mix(in srgb, var(--rn-warning) 40%, transparent);
    border-radius: 10px;
    background: color-mix(in srgb, var(--rn-warning) 10%, var(--rn-surface));
  }

  .item-main {
    flex: 1;
    min-width: 0;
  }

  .item-title {
    font-weight: 500;
    overflow-wrap: anywhere;
  }

  .item-toggle {
    position: relative;
    display: block;
    width: 100%;
    padding: 0 28px 0 0;
    border: 0;
    background: none;
    font-weight: 500;
    text-align: left;
    overflow-wrap: anywhere;
    cursor: pointer;
  }

  .item-toggle::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 6px;
    width: 6px;
    height: 6px;
    margin-top: -5px;
    border-right: 2px solid var(--rn-muted);
    border-bottom: 2px solid var(--rn-muted);
    transform: rotate(45deg);
  }

  .item-toggle.open::after {
    margin-top: -1px;
    transform: rotate(-135deg);
  }

  .item-details,
  .note {
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--rn-head-bg);
    color: var(--rn-muted);
    font-size: 0.93em;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  .item-details {
    margin-top: 6px;
  }

  .item-resolution {
    margin-top: 4px;
    color: var(--rn-muted);
    font-size: 0.93em;
    white-space: pre-line;
  }

  /* Chips */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .item .chips {
    margin-top: 4px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--chip-color, var(--rn-accent)) 20%, transparent);
    color: var(--primary-text-color);
    font-size: 0.85em;
    font-weight: 500;
    line-height: 1.3;
    white-space: nowrap;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--chip-color);
  }

  .chip.features,
  .chip.done {
    --chip-color: var(--rn-success);
  }

  .chip.changes {
    --chip-color: var(--rn-info);
  }

  .chip.issues {
    --chip-color: var(--rn-warning);
  }

  /* Kategorie-Labels */
  .lbl {
    flex-shrink: 0;
    width: 8rem;
    padding: 3px 8px;
    border: 1px solid var(--lbl-bd, transparent);
    border-radius: 6px;
    background: var(--lbl-bg);
    color: var(--lbl-fg);
    font-size: 0.82em;
    font-weight: 500;
    line-height: 1.35;
    text-align: center;
    hyphens: auto;
    overflow-wrap: anywhere;
  }

  .lbl-white { --lbl-bg: var(--lbl-white-bg); --lbl-fg: var(--lbl-white-fg); --lbl-bd: var(--lbl-white-bd); }
  .lbl-gray { --lbl-bg: var(--lbl-gray-bg); --lbl-fg: var(--lbl-gray-fg); }
  .lbl-black { --lbl-bg: var(--lbl-black-bg); --lbl-fg: var(--lbl-black-fg); }
  .lbl-red { --lbl-bg: var(--lbl-red-bg); --lbl-fg: var(--lbl-red-fg); }
  .lbl-orange { --lbl-bg: var(--lbl-orange-bg); --lbl-fg: var(--lbl-orange-fg); }
  .lbl-yellow { --lbl-bg: var(--lbl-yellow-bg); --lbl-fg: var(--lbl-yellow-fg); }
  .lbl-green { --lbl-bg: var(--lbl-green-bg); --lbl-fg: var(--lbl-green-fg); }
  .lbl-blue-light { --lbl-bg: var(--lbl-blue-light-bg); --lbl-fg: var(--lbl-blue-light-fg); }
  .lbl-blue-dark { --lbl-bg: var(--lbl-blue-dark-bg); --lbl-fg: var(--lbl-blue-dark-fg); }
  .lbl-purple { --lbl-bg: var(--lbl-purple-bg); --lbl-fg: var(--lbl-purple-fg); }
  .lbl-pink { --lbl-bg: var(--lbl-pink-bg); --lbl-fg: var(--lbl-pink-fg); }

  .more {
    padding: 4px 16px 16px;
    text-align: center;
  }

  .message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px 16px;
    border-top: 1px solid var(--rn-line);
    color: var(--rn-muted);
    text-align: center;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid var(--rn-line);
    border-top-color: var(--rn-accent);
    border-radius: 50%;
    animation: rn-spin 0.9s linear infinite;
  }

  @keyframes rn-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 450px) {
    .lbl {
      width: 6.5rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation: none;
    }
  }
`;
var et = Object.defineProperty, b = (r, e, t, s) => {
  for (var i = void 0, n = r.length - 1, a; n >= 0; n--)
    (a = r[n]) && (i = a(e, t, i) || i);
  return i && et(e, t, i), i;
};
const tt = 600 * 1e3, M = 1, ne = 50, st = 30, ae = 3600, it = ue`<rect width="64" height="64" rx="14" fill="#4338ca"/><rect x="16" y="11" width="28" height="38" rx="4" fill="#ffffff"/><path d="M36 11H44V19Z" fill="#4338ca"/><path d="M36 11V19H44Z" fill="#c7d2fe"/><rect x="21" y="25" width="18" height="3" rx="1.5" fill="#6462a0"/><rect x="21" y="31" width="14" height="3" rx="1.5" fill="#6462a0"/><rect x="21" y="37" width="10" height="3" rx="1.5" fill="#6462a0"/><rect x="32" y="40" width="25" height="15" rx="7.5" fill="#fbbf24"/><rect x="38" y="45" width="13" height="5" rx="2.5" fill="#312e81"/>`, rt = ue`<path fill="currentColor" d="M8,11H11V21H13V11H16L12,7L8,11M4,3V5H20V3H4Z"/>`;
function oe(r, e, t) {
  return typeof r == "number" && Number.isInteger(r) && r >= e && r <= t;
}
class g extends C {
  constructor() {
    super(...arguments), this._config = { type: "custom:release-notes-card" }, this._failed = !1, this._search = "", this._category = "all", this._displayCount = M, this._expanded = /* @__PURE__ */ new Set(), this._details = /* @__PURE__ */ new Set(), this._started = !1, this._dark = !1, this._newestId = null;
  }
  setConfig(e) {
    if (e.count !== void 0 && !oe(e.count, 1, ne))
      throw new Error(`count must be a whole number from 1 to ${ne}`);
    if (e.auto_collapse !== void 0 && !oe(e.auto_collapse, 0, ae))
      throw new Error(`auto_collapse must be a whole number of seconds from 0 to ${ae}`);
    if (e.title !== void 0 && typeof e.title != "string")
      throw new Error("title must be a text");
    this._config = e, this._displayCount = e.count ?? M;
  }
  getCardSize() {
    return 4 + (this._config.count ?? M) * 3;
  }
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }
  static getStubConfig() {
    return {};
  }
  connectedCallback() {
    super.connectedCallback(), this._refreshTimer = window.setInterval(() => {
      this.hass && this._started && this._load(this.hass, !0);
    }, tt), this.hass && this._started && (this._watch(this.hass), this._load(this.hass, !0));
  }
  disconnectedCallback() {
    window.clearInterval(this._refreshTimer), window.clearTimeout(this._collapseTimer), this._connectionUnsub?.(), this._connectionUnsub = void 0;
    const e = this._unsubscribe;
    this._unsubscribe = void 0, e?.then((t) => t()).catch(() => {
    }), super.disconnectedCallback();
  }
  // Home Assistant sets hass on every state change; only the first one and a
  // switch between light and dark mode matter here.
  shouldUpdate(e) {
    return !(e.size === 1 && e.has("hass") && this._started && !!this.hass?.themes?.darkMode === this._dark);
  }
  willUpdate(e) {
    !e.has("hass") || !this.hass || (this._dark = !!this.hass.themes?.darkMode, this.toggleAttribute("dark", this._dark), this._started || (this._started = !0, this._watch(this.hass), this._load(this.hass, !1)));
  }
  _watch(e) {
    this._unsubscribe || (this._unsubscribe = Be(e, () => {
      this.hass && this._load(this.hass, !0);
    }), this._unsubscribe.catch((t) => {
      console.warn("release_notes_manager: subscribing to updates failed", t), this._unsubscribe = void 0;
    })), this._connectionUnsub || (this._connectionUnsub = Fe(e, () => {
      this.hass && this._load(this.hass, !this._failed);
    }));
  }
  async _load(e, t) {
    try {
      const s = await Ve(e), i = Je(s.releases);
      i !== null && i !== this._newestId && (this._expanded = /* @__PURE__ */ new Set([...this._expanded, i])), this._newestId = i, this._data = s, this._failed = !1;
    } catch (s) {
      console.error("release_notes_manager: loading the release notes failed", s), (!t || !this._data) && (this._failed = !0);
    }
  }
  _retry() {
    this._failed = !1, this.hass && this._load(this.hass, !1);
  }
  // Nach einer Bedienung klappt die Karte nach auto_collapse Sekunden wieder
  // auf die Ausgangsansicht zurück: nur das neueste Release, aufgeklappt.
  _touch() {
    window.clearTimeout(this._collapseTimer);
    const e = this._config.auto_collapse ?? st;
    e > 0 && (this._collapseTimer = window.setTimeout(() => this._resetView(), e * 1e3));
  }
  _resetView() {
    window.clearTimeout(this._collapseTimer), this._displayCount = this._config.count ?? M, this._expanded = new Set(this._newestId !== null ? [this._newestId] : []), this._details = /* @__PURE__ */ new Set();
  }
  _toggleRelease(e) {
    const t = new Set(this._expanded);
    t.delete(e) || t.add(e), this._expanded = t, this._touch();
  }
  _toggleDetails(e) {
    const t = new Set(this._details);
    t.delete(e) || t.add(e), this._details = t, this._touch();
  }
  _showMore() {
    this._displayCount = this._data?.releases.length ?? this._displayCount, this._touch();
  }
  render() {
    if (!this.hass)
      return h;
    const e = [...this._data?.categories ?? []].sort((t, s) => t.label.localeCompare(s.label, "de"));
    return d`
      <div class="toolbar">
        <h2 class="title"><svg viewBox="0 0 64 64" aria-hidden="true">${it}</svg>${this._config.title ?? "Release Notes"}</h2>
        <button type="button" class="icon" title="Nur neuestes Release anzeigen" aria-label="Nur neuestes Release anzeigen" @click=${this._resetView}>
          <svg viewBox="0 0 24 24" aria-hidden="true">${rt}</svg>
        </button>
      </div>
      <div class="filters">
        <input
          type="search"
          placeholder="Suchen …"
          aria-label="Suchen"
          .value=${this._search}
          @input=${(t) => {
      this._search = t.target.value, this._touch();
    }}
        />
        <select
          aria-label="Kategorie"
          @change=${(t) => {
      this._category = t.target.value, this._touch();
    }}
        >
          <option value="all" ?selected=${this._category === "all"}>Alle Kategorien</option>
          ${e.map((t) => d`<option value=${t.id} ?selected=${this._category === t.id}>${t.label}</option>`)}
        </select>
      </div>
      ${this._renderReleases()}
    `;
  }
  _renderReleases() {
    if (!this._data)
      return this._failed ? d`<div class="message">
            <span>Die Release Notes konnten nicht geladen werden.</span>
            <button type="button" class="text" @click=${this._retry}>Erneut versuchen</button>
          </div>` : d`<div class="message"><div class="spinner" role="progressbar" aria-label="Lädt"></div></div>`;
    const e = Xe(this._data.releases, this._search, this._category);
    if (e.length === 0)
      return d`<div class="message">
        ${this._data.releases.length === 0 ? "Noch keine Releases vorhanden." : "Keine Releases gefunden."}
      </div>`;
    const t = this._search ? e : e.slice(0, this._displayCount), s = e.length - t.length;
    return d`
      <div class="releases">${t.map((i) => this._renderRelease(i))}</div>
      ${s > 0 ? d`<div class="more">
            <button type="button" class="text" @click=${this._showMore}>Weitere Releases laden (${s} verbleibend)</button>
          </div>` : h}
    `;
  }
  _renderRelease(e) {
    const t = this._expanded.has(e.id), s = Ye(e), i = _e(e), n = be(e), a = () => this._toggleRelease(e.id);
    return d`<div class="release${t ? " open" : ""}">
      <div
        class="release-head"
        role="button"
        tabindex="0"
        aria-expanded=${t ? "true" : "false"}
        @click=${a}
        @keydown=${(o) => {
      (o.key === "Enter" || o.key === " ") && (o.preventDefault(), a());
    }}
      >
        <div class="release-title-row">
          <h3 class="release-title">Version ${e.version}${e.name ? ` - ${e.name}` : ""}</h3>
          <span class="release-date">${Ge(e.date)}</span>
        </div>
        <div class="chips">
          ${e.id === this._newestId ? d`<span class="chip">Aktuell</span>` : h}
          ${s.features > 0 ? this._chip("features", s.features, s.features === 1 ? "Feature" : "Features") : h}
          ${s.changes > 0 ? this._chip("changes", s.changes, s.changes === 1 ? "Änderung" : "Änderungen") : h}
          ${s.issues > 0 ? this._chip("issues", s.issues, "Fehler") : h}
        </div>
      </div>
      ${t ? d`<div class="release-body">
            ${(e.features ?? []).length > 0 ? d`<div>
                  <h4 class="group-title">Neue Features</h4>
                  <ul class="items">${(e.features ?? []).map((o) => d`<li class="item">${this._renderItem(e, "f", o)}</li>`)}</ul>
                </div>` : h}
            ${(e.changes ?? []).length > 0 || i.length > 0 ? d`<div>
                  <h4 class="group-title">Änderungen / Bugfixes</h4>
                  <ul class="items">
                    ${(e.changes ?? []).map((o) => d`<li class="item">${this._renderItem(e, "c", o)}</li>`)}
                    ${i.map((o) => this._renderResolved(e, o))}
                  </ul>
                </div>` : h}
            ${n.length > 0 ? d`<div>
                  <h4 class="group-title">Bekannte Fehler</h4>
                  <ul class="items issues">${n.map((o) => d`<li class="item issue">${this._renderItem(e, "i", o)}</li>`)}</ul>
                </div>` : h}
            ${e.comments ? d`<div class="note">${e.comments}</div>` : h}
          </div>` : h}
    </div>`;
  }
  _chip(e, t, s) {
    return d`<span class="chip ${e}"><span class="dot"></span>${t} ${s}</span>`;
  }
  _label(e) {
    const t = Ze(this._data?.categories ?? [], e);
    return d`<span class="lbl lbl-${qe(t.color)}">${t.label}</span>`;
  }
  _renderItem(e, t, s) {
    const i = `${e.id}-${t}-${s.id}`, n = this._details.has(i);
    return d`${this._label(s.category)}
      <div class="item-main">
        ${s.details ? d`<button
                type="button"
                class="item-toggle${n ? " open" : ""}"
                aria-expanded=${n ? "true" : "false"}
                @click=${() => this._toggleDetails(i)}
              >
                ${s.title}
              </button>
              ${n ? d`<div class="item-details">${s.details}</div>` : h}` : d`<div class="item-title">${s.title}</div>`}
      </div>`;
  }
  _renderResolved(e, t) {
    return d`<li class="item">
      ${this._label(t.category)}
      <div class="item-main">
        <div class="item-title">${t.title}</div>
        <div class="chips"><span class="chip done">Gelöst in ${e.version}</span></div>
        ${t.resolution ? d`<div class="item-resolution">${t.resolution}</div>` : h}
      </div>
    </li>`;
  }
  static {
    this.styles = Qe;
  }
}
b([
  fe({ attribute: !1 })
], g.prototype, "hass");
b([
  $()
], g.prototype, "_config");
b([
  $()
], g.prototype, "_data");
b([
  $()
], g.prototype, "_failed");
b([
  $()
], g.prototype, "_search");
b([
  $()
], g.prototype, "_category");
b([
  $()
], g.prototype, "_displayCount");
b([
  $()
], g.prototype, "_expanded");
b([
  $()
], g.prototype, "_details");
function nt(r, e) {
  let t = !0;
  for (const [s, i] of e)
    if (!r.get(s)) {
      try {
        r.define(s, i);
      } catch {
      }
      r.get(s) || (t = !1);
    }
  return t;
}
function at(r, e = {}) {
  const t = e.registry ?? (() => window.customElements);
  let s = !1;
  const i = () => {
    !nt(t(), r) && !s && (s = !0, e.onIncomplete?.());
  };
  i();
  const n = setInterval(i, e.intervalMs ?? 2e3);
  return () => clearInterval(n);
}
at([["release-notes-card", g]], {
  onIncomplete: () => console.warn("release_notes_manager: the element registry of this page refuses the card")
});
const L = window;
L.customCards = L.customCards ?? [];
L.customCards.some((r) => r.type === "release-notes-card") || L.customCards.push({
  type: "release-notes-card",
  name: "Release Notes",
  description: "Releases, Änderungen und bekannte Fehler aus dem Release Notes Manager"
});
