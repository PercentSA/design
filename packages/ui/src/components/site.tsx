import { useEffect, useRef, useState, type MouseEventHandler, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useBrand, useLang, useLinkComponent, useStrings, useText } from "../provider";
import { buttonClass } from "./actions";
import { Logo, MadeInKsa, Mark } from "./brand";
import { SkipLink } from "./navigation";

export type NavItem = { href: string; label: ReactNode; current?: boolean };
export type FooterGroup = { title: ReactNode; links: NavItem[] };
export type SocialLink = { href: string; label: string; icon: ReactNode };
/** Content width of SiteHeader and SiteFooter, the same sizes as <Container size>. */
export type SiteWidth = "sm" | "md" | "lg" | "xl" | "full";

// The side padding caps the content like Container, so backgrounds and borders stay full width.
const CAP: Record<SiteWidth, string> = {
  sm: "px-[max(var(--p-gutter),calc((100%-48rem)/2+var(--p-gutter)))]",
  md: "px-[max(var(--p-gutter),calc((100%-64rem)/2+var(--p-gutter)))]",
  lg: "px-[max(var(--p-gutter),calc((100%-80rem)/2+var(--p-gutter)))]",
  xl: "px-[max(var(--p-gutter),calc((100%-1440px)/2+var(--p-gutter)))]",
  full: "",
};

const BAR = "border-b border-transparent bg-linear-to-b from-bg/80 to-transparent transition-colors duration-300 data-scrolled:border-line data-scrolled:bg-bg/90 data-scrolled:backdrop-blur-md";
const POSITION = {
  fixed: `fixed inset-x-0 top-0 z-(--p-z-header) ${BAR}`,
  sticky: `sticky top-0 z-(--p-z-header) ${BAR}`,
  static: "",
} as const;

function NavLinks({ links, className }: { links: NavItem[]; className?: string }) {
  const L = useLinkComponent();
  // Links and legal links may share an href.
  return links.map((l, i) => (
    <L key={`${i}-${l.href}`} href={l.href} aria-current={l.current ? "page" : undefined} className={className}>
      {l.label}
    </L>
  ));
}

/**
 * A real link to the same page in the other language, named in that language ("العربية", "English").
 * Pass onClick to play the language-switch scramble (@percentsa/motion) before navigating.
 */
export function LangSwitch({ href, onClick, className }: { href: string; onClick?: MouseEventHandler<HTMLAnchorElement>; className?: string }) {
  const other = useLang() === "ar" ? "en" : "ar";
  const L = useLinkComponent();
  return (
    <L href={href} lang={other} hrefLang={other} onClick={onClick} className={cn(buttonClass("secondary"), className)}>
      {useText()(useStrings().otherLanguage)}
    </L>
  );
}

/** Full-screen phone menu on a native <dialog> (focus trap and Escape for free). Hidden from 768 px. `brand` replaces the mark in its top bar. */
export function MobileMenu({ links, footer, brand, className }: { links: NavItem[]; footer?: ReactNode; brand?: ReactNode; className?: string }) {
  const s = useStrings();
  const logo = useBrand()?.mark;
  const t = useText();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  // An open modal dialog on a wide screen would leave the page inert while the menu is hidden.
  useEffect(() => {
    const wide = matchMedia("(min-width: 768px)");
    const onChange = () => wide.matches && close();
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()} className={cn(buttonClass("secondary"), "md:hidden", className)}>
        {t(s.menu)}
      </button>
      <dialog
        ref={dialog}
        aria-label={s.menu}
        onClick={(e) => (e.target as Element).closest("a") && close()}
        className="p-menu fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-bg p-0 text-fg backdrop:bg-transparent md:hidden"
      >
        <div className="flex h-full flex-col px-(--p-gutter) pb-10">
          <div className="flex h-16 items-center justify-between">
            {brand ?? logo ?? <Mark />}
            <button type="button" onClick={close} className={buttonClass("secondary")}>
              {t(s.close)}
            </button>
          </div>
          <nav aria-label={s.menu} className="display mt-12 grid gap-6 text-5xl">
            <NavLinks links={links} className="aria-[current=page]:text-fg-2" />
          </nav>
          {footer && <div className="p-menu-foot mt-auto flex flex-wrap gap-3">{footer}</div>}
        </div>
      </dialog>
    </>
  );
}

/**
 * Header: brand, section links (centre, from 768 px), actions (end). On phones the links and
 * actions move into the MobileMenu; `menuFooter` replaces the actions there (for example, primary first).
 * Without links there is no menu and the actions stay visible on phones.
 * `position`: fixed over the page (default; darkens after the first scroll), sticky, or static (in the flow, no bar).
 * `width`: content width like <Container size> (default full).
 */
export function SiteHeader({
  homeHref,
  links,
  actions,
  menuFooter = actions,
  brand,
  position = "fixed",
  width = "full",
  className,
}: {
  homeHref: string;
  links: NavItem[];
  actions?: ReactNode;
  menuFooter?: ReactNode;
  brand?: ReactNode;
  position?: keyof typeof POSITION;
  width?: SiteWidth;
  className?: string;
}) {
  const s = useStrings();
  const L = useLinkComponent();
  const logo = useBrand()?.wordmark;
  const lang = useLang();
  const [scrolled, setScrolled] = useState(false);
  const bar = position !== "static";
  useEffect(() => {
    if (!bar) return;
    const update = () => setScrolled(scrollY > 8);
    update();
    addEventListener("scroll", update, { passive: true });
    return () => removeEventListener("scroll", update);
  }, [bar]);
  const menu = links.length > 0;
  return (
    <header data-scrolled={scrolled || undefined} className={cn(POSITION[position], className) || undefined}>
      <SkipLink />
      <div
        className={cn(
          menu ? "grid h-16 grid-cols-[1fr_auto] items-center px-(--p-gutter) md:h-20 md:grid-cols-[1fr_auto_1fr]" : "grid h-16 grid-cols-[1fr_auto] items-center px-(--p-gutter) md:h-20",
          CAP[width],
        )}
      >
        <L href={homeHref} aria-label={s.home} className="w-fit">
          {brand ?? logo ?? <Logo version={lang === "ar" ? "icon-ar" : "icon-en"} />}
        </L>
        {menu && (
          <nav aria-label={s.mainNavigation} className="hidden gap-9 text-sm font-medium text-fg-2 md:flex">
            <NavLinks links={links} className="transition-colors hover:text-fg aria-[current=page]:text-fg" />
          </nav>
        )}
        <div className="flex items-center gap-2.5 justify-self-end">
          {actions && <div className={menu ? "hidden items-center gap-2.5 md:flex" : "flex items-center gap-2.5"}>{actions}</div>}
          {menu && <MobileMenu links={links} footer={menuFooter} brand={brand} />}
        </div>
      </div>
    </header>
  );
}

const FLAT_NAV = "flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-fg-2";

// The year in Riyadh, so the server and every browser render the same year.
const RIYADH_YEAR = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Riyadh" });

/**
 * Footer: brand and email (or `contact`) at the start; links, link `groups`, actions and `social` icon links at the end;
 * `children` in a full-width row; then "© year copyright" (or `notice`) and `badges` (default "Made in KSA"; null hides it).
 */
export function SiteFooter({
  homeHref,
  email,
  links = [],
  legal = [],
  actions,
  copyright,
  brand,
  contact,
  groups,
  social,
  notice,
  badges = <MadeInKsa />,
  children,
  width = "full",
  className,
}: {
  homeHref: string;
  email?: string;
  links?: NavItem[];
  legal?: NavItem[];
  actions?: ReactNode;
  /** Text after "© <year>", for example "Percent. All rights reserved." */
  copyright?: ReactNode;
  /** Replaces the mark (default: the provider's mark, else Percent's). */
  brand?: ReactNode;
  /** Replaces the email link. */
  contact?: ReactNode;
  /** Link columns with a heading each, after `links`. */
  groups?: FooterGroup[];
  /** Icon links that open in a new tab; `label` names each one. */
  social?: SocialLink[];
  /** Replaces the whole "© year copyright" text. */
  notice?: ReactNode;
  badges?: ReactNode;
  /** A full-width row between the top and bottom rows (newsletter, call to action). */
  children?: ReactNode;
  /** Content width like <Container size>; the borders stay full width. */
  width?: SiteWidth;
  className?: string;
}) {
  const s = useStrings();
  const L = useLinkComponent();
  const logo = useBrand()?.mark;
  const nav = [...links, ...legal];
  return (
    <footer className={cn("border-t border-line", className)}>
      <div className={cn("flex flex-col gap-12 px-(--p-gutter) py-16 md:flex-row md:items-end md:justify-between", CAP[width])}>
        <div>
          <L href={homeHref} aria-label={s.home} className="inline-block">
            {brand ?? logo ?? <Mark className="h-9" />}
          </L>
          {contact ? (
            <div className="mt-8">{contact}</div>
          ) : (
            email && (
              <a href={`mailto:${email}`} lang="en" className="display mt-8 block text-3xl wrap-break-word transition-colors hover:text-fg-2 md:text-5xl">
                {email}
              </a>
            )
          )}
        </div>
        {/* With groups this column takes the free width (and may shrink), so the columns sit side by side or wrap. */}
        <div className={cn("flex flex-col gap-6 md:items-end", groups && "min-w-0 md:flex-1")}>
          {nav.length > 0 && !groups && (
            <nav aria-label={s.siteLinks} className={FLAT_NAV}>
              <NavLinks links={nav} className="transition-colors hover:text-fg" />
            </nav>
          )}
          {groups && (
            // One "Site links" landmark for the flat links and the columns.
            <nav aria-label={s.siteLinks} className="grid w-full gap-8 md:max-w-3xl">
              {nav.length > 0 && (
                <div className={FLAT_NAV}>
                  <NavLinks links={nav} className="transition-colors hover:text-fg" />
                </div>
              )}
              <div className="grid gap-8 text-sm md:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
                {groups.map((g, i) => (
                  <div key={i}>
                    <h2 className="font-medium text-fg">{g.title}</h2>
                    <ul className="mt-3 grid gap-2 text-fg-2">
                      {g.links.map((l, j) => (
                        <li key={`${j}-${l.href}`}>
                          <L href={l.href} aria-current={l.current ? "page" : undefined} className="transition-colors hover:text-fg">
                            {l.label}
                          </L>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>
          )}
          {actions}
          {social && (
            <ul className="flex flex-wrap gap-2">
              {social.map((x) => (
                <li key={x.href}>
                  <a href={x.href} aria-label={`${x.label} ${s.newTab}`} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "md", true)}>
                    {x.icon}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {children && <div className={cn("border-t border-line px-(--p-gutter) py-10", CAP[width])}>{children}</div>}
      <div className={cn("flex flex-wrap items-center justify-between gap-4 border-t border-line px-(--p-gutter) py-6 text-sm text-fg-3", CAP[width])}>
        <span>{notice ?? <>© {RIYADH_YEAR.format(new Date())} {copyright}</>}</span>
        {badges}
      </div>
    </footer>
  );
}
