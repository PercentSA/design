import { useEffect, useRef, useState } from "react";
import {
  Counter,
  LogoLoader,
  Magnetic,
  Marquee,
  Reveal,
  ScenePlayer,
  ScrambleProvider,
  ScrambleText,
  SlashReveal,
  usePlayOnce,
  useScramble,
  useSuccessWipe,
  ViewCursor,
} from "@percentsa/motion";
import { Button, Inline, Mark, Stack, Text } from "@percentsa/ui";
import { useT } from "~/lib/t";

export function ScrambleExample() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  // In an app, navigate() changes the route (/en ↔ /ar) and writes the language cookie.
  return (
    <ScrambleProvider navigate={(next) => setLang(next as "en" | "ar")}>
      <ScrambleDemo lang={lang} />
    </ScrambleProvider>
  );
}

function ScrambleDemo({ lang }: { lang: "en" | "ar" }) {
  const { request } = useScramble();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  return (
    <Stack gap={6} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <p className="display text-4xl">
        <ScrambleText>{t("We build software", "نبني البرمجيات")}</ScrambleText>
      </p>
      <p className="max-w-md text-fg-2">
        <ScrambleText block>{t("Design, engineering and operations in one studio.", "التصميم والهندسة والتشغيل في استوديو واحد.")}</ScrambleText>
      </p>
      <Button variant="secondary" className="w-fit" onClick={() => request(lang === "en" ? "ar" : "en")}>
        {lang === "en" ? "العربية" : "English"}
      </Button>
    </Stack>
  );
}

export function RevealExample() {
  const t = useT();
  const [key, setKey] = useState(0);
  return (
    <Stack gap={6}>
      <Reveal key={key} stagger className="grid gap-2">
        <p className="label">{t("Case study", "دراسة حالة")}</p>
        <p className="display text-4xl">Masar</p>
        <p className="text-fg-2">{t("Fleet tracking for a logistics company.", "تتبع أسطول لشركة لوجستية.")}</p>
      </Reveal>
      <Button variant="secondary" size="sm" className="w-fit" onClick={() => setKey(key + 1)}>
        {t("Replay", "أعد التشغيل")}
      </Button>
    </Stack>
  );
}

export function SlashRevealExample() {
  const t = useT();
  const [key, setKey] = useState(0);
  return (
    <Stack gap={6} className="w-full max-w-md">
      <SlashReveal key={key} aspect={4 / 3} className="rounded-card">
        <div className="grid bg-fg text-bg">
          <Mark className="m-auto h-24" />
        </div>
      </SlashReveal>
      <Button variant="secondary" size="sm" className="w-fit" onClick={() => setKey(key + 1)}>
        {t("Replay", "أعد التشغيل")}
      </Button>
    </Stack>
  );
}

export function MarqueeExample() {
  const t = useT();
  const names = ["Masar", "Nahj", "Tuwaiq", "Rawabi", "Sahm", "Watad", "Qimam"];
  return (
    <Marquee className="w-full" seconds={30} labels={{ pause: t("Pause", "إيقاف مؤقت"), play: t("Play", "تشغيل") }}>
      {names.map((n) => (
        <li key={n} className="display text-3xl text-fg-3" lang="en">
          {n}
        </li>
      ))}
    </Marquee>
  );
}

export function MagneticExample() {
  const t = useT();
  return (
    <Magnetic>
      <Button size="lg">{t("Start a project", "ابدأ مشروعًا")}</Button>
    </Magnetic>
  );
}

export function ViewCursorExample() {
  const t = useT();
  return (
    <>
      <ViewCursor label={t("View", "عرض")} />
      <a href="#masar" data-cursor="view" className="grid h-48 w-72 place-items-end rounded-card border border-line bg-surface-2 p-5">
        <span className="font-medium">Masar</span>
      </a>
    </>
  );
}

export function PlayOnceExample() {
  const t = useT();
  const card = useRef<HTMLDivElement>(null);
  usePlayOnce(card);
  return (
    <div ref={card} tabIndex={0} className="grid w-72 gap-4 rounded-card border border-line bg-surface p-5">
      <div data-picture className="grid h-28 content-end gap-2">
        {[80, 55, 95, 40].map((w) => (
          <span key={w} className="demo-bar block h-3 rounded-pill bg-fg" style={{ width: `${w}%` }} />
        ))}
      </div>
      <Text size="sm" tone="muted">{t("Plays on view, hover and focus.", "يعمل عند الظهور والتمرير والتركيز.")}</Text>
    </div>
  );
}

export function CounterExample() {
  const t = useT();
  const [key, setKey] = useState(0);
  return (
    <Stack gap={6}>
      <Inline gap={12} key={key}>
        <div>
          <Counter value={48} className="display text-6xl" />
          <Text size="sm" tone="muted">{t("projects shipped", "مشروعًا مُطلقًا")}</Text>
        </div>
        <div>
          <Counter value={1250000} className="display text-6xl" />
          <Text size="sm" tone="muted">{t("monthly users", "مستخدم شهريًا")}</Text>
        </div>
      </Inline>
      <Button variant="secondary" size="sm" className="w-fit" onClick={() => setKey(key + 1)}>
        {t("Replay", "أعد التشغيل")}
      </Button>
    </Stack>
  );
}

const STEP_MS = 4000;

export function ScenePlayerExample() {
  const t = useT();
  const steps = [t("Design", "التصميم"), t("Build", "البناء"), t("Run", "التشغيل")];
  const [playing, setPlaying] = useState(true);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      setProgress((p) => {
        const next = p + (now - last) / STEP_MS;
        if (next >= 1) setActive((a) => (a + 1) % 3);
        return next >= 1 ? 0 : next;
      });
      last = now;
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  return (
    <Stack gap={4} align="center">
      <p className="display text-4xl">{steps[active]}</p>
      <ScenePlayer
        label={t("Services animation", "حركة الخدمات")}
        steps={steps}
        active={active}
        progress={progress}
        playing={playing}
        onToggle={() => setPlaying(!playing)}
        onJump={(i) => (setActive(i), setProgress(0))}
        labels={{ play: t("Play", "تشغيل"), pause: t("Pause", "إيقاف مؤقت"), show: (s) => t(`Show ${s}`, `اعرض ${s}`) }}
      />
    </Stack>
  );
}

export function SuccessWipeExample() {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLSpanElement>(null);
  const wipe = useSuccessWipe(box, band);
  const [sent, setSent] = useState(false);
  return (
    <div ref={box} className="relative grid w-full max-w-md">
      <span ref={band} className="p-wipe" aria-hidden="true" />
      {sent ? (
        <div role="status" className="grid min-h-48 place-items-center rounded-card border border-line bg-surface p-8">
          <p className="display text-3xl">{t("Thanks. We reply within a day.", "شكرًا. نرد خلال يوم.")}</p>
        </div>
      ) : (
        <form
          className="grid min-h-48 content-center gap-4 rounded-card border border-line bg-surface p-8"
          onSubmit={(e) => {
            e.preventDefault();
            wipe(() => setSent(true));
          }}
        >
          <Text tone="muted">{t("A form that sends.", "نموذج يُرسل.")}</Text>
          <Button type="submit" className="w-fit">{t("Send", "أرسل")}</Button>
        </form>
      )}
    </div>
  );
}

export function LogoLoaderExample() {
  const t = useT();
  return <LogoLoader label={t("Loading", "جارٍ التحميل")} className="block h-auto w-full max-w-md" />;
}
