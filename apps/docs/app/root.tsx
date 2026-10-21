import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useParams, useRouteLoaderData } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [{ rel: "icon", type: "image/svg+xml", href: "/percent.svg" }];

export function loader({ request }: Route.LoaderArgs) {
  const theme = /(?:^|;\s*)theme=light/.test(request.headers.get("cookie") ?? "") ? "light" : "dark";
  return { theme };
}

// Before first paint: hidden start states of reveal animations apply only when scripts run.
const HEAD_SCRIPT = `document.documentElement.classList.add("js")`;

export function Layout({ children }: { children: React.ReactNode }) {
  const lang = useParams().lang === "ar" ? "ar" : "en";
  const theme = useRouteLoaderData<typeof loader>("root")?.theme ?? "dark";
  return (
    // suppressHydrationWarning: the head script adds a class, the theme switch changes data-theme.
    // data-page-transition: links with viewTransition wipe the new page in (@percentsa/motion).
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} data-theme={theme} data-page-transition="slash" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  if (!isRouteErrorResponse(error) && typeof window !== "undefined") console.error(error);
  return (
    <main className="mx-auto grid max-w-xl gap-4 px-6 py-32">
      <h1 className="display text-5xl">{status}</h1>
      <p className="text-fg-2">{status === 401 ? "Authentication required." : status === 404 ? "Page not found." : "Something went wrong."}</p>
      <a href="/en" className="underline underline-offset-4">
        Percent Design
      </a>
    </main>
  );
}
