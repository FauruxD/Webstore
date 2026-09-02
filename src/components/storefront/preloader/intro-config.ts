/**
 * Shared contract between the blocking intro gate script, the preloader
 * overlay, and the homepage hero entrance.
 */

/** sessionStorage flag. Bump the suffix to force the intro again for everyone. */
export const INTRO_SESSION_KEY = 'atelier:intro:v1';

/** Fired when the center split starts, so the hero can enter underneath it. */
export const INTRO_EXIT_EVENT = 'atelier:intro-exit';

/** Hard ceiling on font + hero image waiting before the exit plays anyway. */
export const INTRO_ASSET_TIMEOUT_MS = 4000;

/**
 * Runs before the storefront body paints. Decides whether this load gets the
 * intro and, if so, raises the ivory curtain via `html[data-intro]` in CSS so
 * the homepage never flashes ahead of the overlay.
 */
declare global {
  interface Window {
    /**
     * Set by the gate script when this page load earned an intro. React cannot
     * touch a window property, so this stays reliable even though the
     * `data-intro` attribute lives on the hydrated `<html>` element.
     */
    __ATELIER_INTRO__?: boolean;
  }
}

/** Source of truth for the client components. Attribute is for CSS only. */
export function introRequestedOnLoad(): boolean {
  return typeof window !== 'undefined' && window.__ATELIER_INTRO__ === true;
}

export const INTRO_GATE_SCRIPT = `(function(){try{
if(window.location.pathname!=='/')return;
var force=/(?:^|[?&])intro=1(?:&|$)/.test(window.location.search);
if(!force){try{if(window.sessionStorage.getItem('${INTRO_SESSION_KEY}'))return;}catch(e){}}
var r=document.documentElement;
window.__ATELIER_INTRO__=true;
r.setAttribute('data-intro','pending');
// Failsafe: if the overlay never takes over (chunk error, JS disabled mid-load)
// the curtain lifts on its own instead of trapping the page behind it.
setTimeout(function(){if(r.getAttribute('data-intro')==='pending')r.removeAttribute('data-intro');},${INTRO_ASSET_TIMEOUT_MS + 2000});
}catch(e){}})();`;
