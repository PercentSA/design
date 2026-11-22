/** Elements that can take the focus now: no hidden input, no disabled control, no tabindex="-1". */
export const FOCUSABLE = 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';
