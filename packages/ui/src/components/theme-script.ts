export const THEME_KEY = "p-theme";

/**
 * Put in <head> before the stylesheets: applies the stored choice to <html data-theme> before first paint.
 * With nothing stored (or storage blocked), the page's own data-theme stays.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="system"||t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
