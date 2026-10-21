import { useState } from "react";
import { ChartColumn, FileText, Inbox, LayoutDashboard, Languages, LogOut, Moon, Plus, Search, Settings, Users } from "lucide-react";
import { AppShell, Button, type Command, CommandPalette, Heading, Kbd, Logo, Mark, Sidebar, type SidebarSection, Text, toast, useCommandShortcut, useLang } from "@percentsa/ui";
import { useT } from "~/lib/t";

function useSections(current = "#inbox"): SidebarSection[] {
  const t = useT();
  const sections: SidebarSection[] = [
    {
      title: t("Workspace", "مساحة العمل"),
      items: [
        { href: "#overview", label: t("Overview", "نظرة عامة"), icon: <LayoutDashboard /> },
        { href: "#inbox", label: t("Inbox", "الوارد"), icon: <Inbox />, badge: 4 },
        { href: "#invoices", label: t("Invoices", "الفواتير"), icon: <FileText /> },
        { href: "#reports", label: t("Reports", "التقارير"), icon: <ChartColumn /> },
      ],
    },
    {
      title: t("Team", "الفريق"),
      items: [
        { href: "#members", label: t("Members", "الأعضاء"), icon: <Users /> },
        { href: "#settings", label: t("Settings", "الإعدادات"), icon: <Settings /> },
      ],
    },
  ];
  return sections.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, current: i.href === current })) }));
}

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  const lang = useLang();
  return collapsed ? <Mark className="mx-auto" /> : <Logo version={lang === "ar" ? "icon-ar" : "icon-en"} />;
}

function User({ collapsed }: { collapsed?: boolean }) {
  const t = useT();
  return (
    <div className="flex items-center gap-3 px-1">
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-pill bg-fg text-xs font-semibold text-bg">
        {t("SA", "سع")}
      </span>
      {/* The name stays readable for screen readers in the icon rail. */}
      <span className={collapsed ? "sr-only" : "truncate text-sm"}>{t("Sara Alotaibi", "سارة العتيبي")}</span>
    </div>
  );
}

function useCommands(): Command[] {
  const t = useT();
  const done = (title: string) => () => toast({ title });
  const actions = t("Actions", "إجراءات");
  const go = t("Go to", "انتقل إلى");
  const settings = t("Settings", "الإعدادات");
  return [
    { id: "new-invoice", group: actions, label: t("Create invoice", "إنشاء فاتورة"), icon: <Plus />, shortcut: "Ctrl N", keywords: ["bill"], onSelect: done(t("New invoice", "فاتورة جديدة")) },
    { id: "invite", group: actions, label: t("Invite a member", "دعوة عضو"), icon: <Users />, onSelect: done(t("Invitation sent", "أُرسلت الدعوة")) },
    { id: "inbox", group: go, label: t("Inbox", "الوارد"), icon: <Inbox />, onSelect: done(t("Inbox", "الوارد")) },
    { id: "reports", group: go, label: t("Reports", "التقارير"), icon: <ChartColumn />, keywords: ["charts", "رسوم"], onSelect: done(t("Reports", "التقارير")) },
    { id: "theme", group: settings, label: t("Switch theme", "تبديل المظهر"), icon: <Moon />, keywords: ["dark", "light", "داكن", "فاتح"], onSelect: done(t("Theme switched", "تم تبديل المظهر")) },
    { id: "lang", group: settings, label: t("Change language", "تغيير اللغة"), icon: <Languages />, keywords: ["arabic", "english", "عربي"], onSelect: done(t("Language changed", "تم تغيير اللغة")) },
    { id: "sign-out", group: settings, label: t("Sign out", "تسجيل الخروج"), icon: <LogOut />, onSelect: done(t("Signed out", "تم تسجيل الخروج")) },
  ];
}

/**
 * An app fills the page with the shell; here a fixed-height box holds it, inside the docs page's <main>, so it is
 * `embedded` (no second <main>, header landmark or skip link). Below 1024 px the menu button opens the sidebar.
 */
export function AppShellExample() {
  const t = useT();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState(false);
  return (
    // clip-path: the blurred sticky header would paint over the rounded corners.
    <div className="h-[30rem] w-full overflow-auto rounded-card border border-line [clip-path:inset(0_round_var(--p-radius-card))]">
      <AppShell
        embedded
        mainId="app-shell-example-main"
        className="min-h-full"
        sidebar={
          <Sidebar
            sections={useSections()}
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            header={<SidebarLogo collapsed={collapsed} />}
            footer={<User collapsed={collapsed} />}
          />
        }
        header={
          <>
            <Heading level={2} size={6} className="truncate">
              {t("Inbox", "الوارد")}
            </Heading>
            <Button variant="secondary" size="sm" className="ms-auto" onClick={() => setSearch(true)}>
              <Search aria-hidden />
              {t("Search", "بحث")}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 p-4 lg:p-6">
          {[
            t("Payment received from Nakheel Co.", "وصلت دفعة من شركة نخيل"),
            t("Invoice 1042 is due tomorrow", "تستحق الفاتورة 1042 غدًا"),
            t("Huda commented on the Q3 report", "علّقت هدى على تقرير الربع الثالث"),
          ].map((line) => (
            <div key={line} className="rounded-field border border-line bg-surface px-4 py-3">
              <Text size="sm">{line}</Text>
            </div>
          ))}
        </div>
      </AppShell>
      <CommandPalette open={search} onOpenChange={setSearch} commands={useCommands()} />
    </div>
  );
}

/** Click an item: the current-page mark slides to it. */
export function SidebarExample() {
  const [collapsed, setCollapsed] = useState(false);
  const [current, setCurrent] = useState("#inbox");
  return (
    <div
      className="h-[28rem] overflow-hidden rounded-card border border-line"
      onClick={(e) => {
        const href = (e.target as Element).closest("nav a")?.getAttribute("href");
        if (!href) return;
        e.preventDefault(); // an app's router sets `current`; here a click does
        setCurrent(href);
      }}
    >
      <Sidebar
        sections={useSections(current)}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        header={<SidebarLogo collapsed={collapsed} />}
        footer={<User collapsed={collapsed} />}
      />
    </div>
  );
}

/** Ctrl+K (⌘K on a Mac) opens it anywhere on this page. Try "انشاء فاتوره": Arabic letter forms match. */
export function CommandPaletteExample() {
  const t = useT();
  const [open, setOpen] = useState(false);
  useCommandShortcut(() => setOpen((o) => !o));
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Search aria-hidden />
        {t("Search commands", "ابحث في الأوامر")}
        <Kbd>Ctrl K</Kbd>
      </Button>
      <CommandPalette open={open} onOpenChange={setOpen} commands={useCommands()} />
    </>
  );
}
