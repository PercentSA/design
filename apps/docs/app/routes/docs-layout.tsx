import { useState, type ComponentProps } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { Link, Outlet, redirect, useLocation, useParams, useRouteLoaderData } from "react-router";
import { Badge, Button, cn, LangSwitch, Logo, PercentProvider, Sheet, SkipLink, Toaster, Tooltip, type Lang } from "@percentsa/ui";
import type { Route } from "./+types/docs-layout";
import { GROUPS, PAGES } from "~/docs/catalogue";
import { COPY } from "~/docs/copy";
import { FOUNDATIONS } from "~/docs/foundations";

export function loader({ params }: Route.LoaderArgs) {
  if (params.lang !== "en" && params.lang !== "ar") throw redirect("/en");
  return null;
}

// Page links play the page transition (data-page-transition on <html>); links to a place on the same page do not.
const RouterLink = ({ href = "#", ...p }: ComponentProps<"a">) => <Link to={href} viewTransition={!href.startsWith("#")} {...p} />;

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const current = useLocation().pathname === to;
  return (
    <Link
      to={to}
      viewTransition
      aria-current={current ? "page" : undefined}
      className="block rounded-lg px-3 py-1.5 text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:text-fg"
    >
      {children}
    </Link>
  );
}

function DocsNav({ lang }: { lang: Lang }) {
  return (
    <nav aria-label={COPY.components[lang]} className="grid gap-6 pb-10">
      <div className="grid gap-0.5">
        <NavLink to={`/${lang}`}>{COPY.overview[lang]}</NavLink>
        <NavLink to={`/${lang}/all`}>{COPY.all[lang]}</NavLink>
        <NavLink to={`/${lang}/changelog`}>{COPY.changelog[lang]}</NavLink>
      </div>
      <div className="grid gap-0.5">
        <p className="label px-3 pb-2">{COPY.foundations[lang]}</p>
        {FOUNDATIONS.map((f) => (
          <NavLink key={f.slug} to={`/${lang}/foundations/${f.slug}`}>
            {f.title[lang]}
          </NavLink>
        ))}
      </div>
      {GROUPS.map((g) => (
        <div key={g.id} className="grid gap-0.5">
          <p className="label px-3 pb-2">{g.title[lang]}</p>
          {PAGES.filter((p) => p.group === g.id).map((p) => (
            <NavLink key={p.slug} to={`/${lang}/components/${p.slug}`}>
              {p.name}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

function ThemeSwitch({ lang }: { lang: Lang }) {
  const initial = useRouteLoaderData<{ theme: "dark" | "light" }>("root")?.theme ?? "dark";
  const [theme, setTheme] = useState(initial);
  const next = theme === "dark" ? "light" : "dark";
  const label = `${COPY.theme[lang]}: ${next === "light" ? (lang === "ar" ? "فاتح" : "Light") : lang === "ar" ? "داكن" : "Dark"}`;
  return (
    <Tooltip content={label}>
      <Button
        variant="ghost"
        iconOnly
        aria-label={label}
        onClick={() => {
          document.documentElement.dataset.theme = next;
          document.cookie = `theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
          setTheme(next);
        }}
      >
        {theme === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
      </Button>
    </Tooltip>
  );
}

export default function DocsLayout() {
  const lang = useParams().lang as Lang;
  const { pathname, search } = useLocation();
  const other = lang === "ar" ? "en" : "ar";
  const [menu, setMenu] = useState(false);
  return (
    <PercentProvider lang={lang} link={RouterLink}>
      <SkipLink />
      <header className="sticky top-0 z-(--p-z-header) flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur-md md:px-8">
        <Link to={`/${lang}`} viewTransition className="flex items-center gap-3" aria-label={COPY.title[lang]}>
          <Logo version={lang === "ar" ? "icon-ar" : "icon-en"} />
          <Badge variant="outline" className="hidden sm:inline-flex">
            {COPY.short[lang]}
          </Badge>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitch lang={lang} />
          <LangSwitch href={pathname.replace(/^\/(en|ar)/, `/${other}`) + search} />
          <Sheet
            open={menu}
            onOpenChange={setMenu}
            side="start"
            title={COPY.title[lang]}
            trigger={
              <Button variant="secondary" iconOnly aria-label={lang === "ar" ? "القائمة" : "Menu"} className="lg:hidden">
                <Menu aria-hidden />
              </Button>
            }
          >
            <div onClick={(e) => (e.target as Element).closest("a") && setMenu(false)}>
              <DocsNav lang={lang} />
            </div>
          </Sheet>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] overflow-y-auto border-e border-line px-4 pt-8 lg:block">
          <DocsNav lang={lang} />
        </aside>
        <main id="main" tabIndex={-1} className={cn("min-w-0 px-5 py-10 outline-none md:px-10 lg:px-14 lg:py-14")}>
          <Outlet />
        </main>
      </div>
      <Toaster />
    </PercentProvider>
  );
}
