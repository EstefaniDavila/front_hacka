/**
 * Safe DOM Patch for Web Environments (Expo Web & React DOM)
 * 
 * Prevents unhandled React DOM reconciliation crashes caused by external DOM mutations
 * such as Google Chrome Translate, browser extensions, or third-party scripts.
 * 
 * When Chrome translates a web page, it wraps text nodes inside <font> tags.
 * When React attempts to remove or insert DOM nodes during component unmounting / re-rendering:
 *   - parentInstance.removeChild(child) fails with NotFoundError because child.parentNode is <font>
 *   - parentInstance.insertBefore(newNode, ref) fails if ref.parentNode is not parentInstance
 * 
 * This module monkey-patches Node.prototype.removeChild and insertBefore to handle these safely,
 * and sets lang="es", translate="no", and notranslate meta tags to prevent translation popups.
 */

if (typeof window !== 'undefined' && typeof Node !== 'undefined') {
  // 1. Prevent Google Chrome Translate from modifying DOM nodes
  if (typeof document !== 'undefined') {
    try {
      if (document.documentElement) {
        document.documentElement.setAttribute('lang', 'es');
        document.documentElement.setAttribute('translate', 'no');
        document.documentElement.classList.add('notranslate');
      }
      if (document.body) {
        document.body.classList.add('notranslate');
      }
      if (document.head && !document.querySelector('meta[name="google"][content="notranslate"]')) {
        const meta = document.createElement('meta');
        meta.name = 'google';
        meta.content = 'notranslate';
        document.head.appendChild(meta);
      }
    } catch (_) {}
  }

  // 2. Safe monkey patch for removeChild
  const origRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[SafeDOM] Prevented removeChild crash from external DOM mutation (e.g. Chrome translate):', child);
      }
      if (child.parentNode) {
        try {
          return child.parentNode.removeChild(child);
        } catch (_) {}
      }
      return child;
    }
    return origRemoveChild.apply(this, arguments);
  };

  // 3. Safe monkey patch for insertBefore
  const origInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[SafeDOM] Prevented insertBefore crash from external DOM mutation (e.g. Chrome translate):', referenceNode);
      }
      try {
        return this.appendChild(newNode);
      } catch (_) {
        return newNode;
      }
    }
    return origInsertBefore.apply(this, arguments);
  };
}

export default true;
