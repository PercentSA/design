import type { ComponentType } from "react";
import type { Group } from "./catalogue";
import * as actions from "~/examples/actions";
import actionsSrc from "~/examples/actions.tsx?raw";
import * as brand from "~/examples/brand";
import brandSrc from "~/examples/brand.tsx?raw";
import * as feedback from "~/examples/feedback";
import feedbackSrc from "~/examples/feedback.tsx?raw";
import * as forms from "~/examples/forms";
import formsSrc from "~/examples/forms.tsx?raw";
import * as layout from "~/examples/layout";
import layoutSrc from "~/examples/layout.tsx?raw";
import * as motion from "~/examples/motion";
import motionSrc from "~/examples/motion.tsx?raw";
import * as motionText from "~/examples/motion-text";
import motionTextSrc from "~/examples/motion-text.tsx?raw";
import * as flip from "~/examples/flip";
import flipSrc from "~/examples/flip.tsx?raw";
import * as motionCss from "~/examples/motion-css";
import motionCssSrc from "~/examples/motion-css.tsx?raw";
import * as navigation from "~/examples/navigation";
import navigationSrc from "~/examples/navigation.tsx?raw";
import * as overlays from "~/examples/overlays";
import overlaysSrc from "~/examples/overlays.tsx?raw";
import * as saudi from "~/examples/saudi";
import saudiSrc from "~/examples/saudi.tsx?raw";
import * as saudiForms from "~/examples/saudi-forms";
import saudiFormsSrc from "~/examples/saudi-forms.tsx?raw";
import * as dataTables from "~/examples/data-tables";
import dataTablesSrc from "~/examples/data-tables.tsx?raw";
import * as dataItems from "~/examples/data-items";
import dataItemsSrc from "~/examples/data-items.tsx?raw";
import * as boards from "~/examples/boards";
import boardsSrc from "~/examples/boards.tsx?raw";
import * as code from "~/examples/code";
import codeSrc from "~/examples/code.tsx?raw";
import * as charts from "~/examples/charts";
import chartsSrc from "~/examples/charts.tsx?raw";
import * as appShell from "~/examples/app-shell";
import appShellSrc from "~/examples/app-shell.tsx?raw";
import * as appForms from "~/examples/app-forms";
import appFormsSrc from "~/examples/app-forms.tsx?raw";
import * as business from "~/examples/business";
import businessSrc from "~/examples/business.tsx?raw";
import * as text from "~/examples/text";
import textSrc from "~/examples/text.tsx?raw";
import * as utilities from "~/examples/utilities";
import utilitiesSrc from "~/examples/utilities.tsx?raw";

type Examples = { module: Record<string, unknown>; src: string };

// A group can keep its examples in several files.
export const EXAMPLES: Record<Group, Examples[]> = {
  actions: [{ module: actions, src: actionsSrc }],
  brand: [{ module: brand, src: brandSrc }],
  feedback: [{ module: feedback, src: feedbackSrc }],
  forms: [{ module: forms, src: formsSrc }],
  layout: [{ module: layout, src: layoutSrc }],
  motion: [
    { module: motion, src: motionSrc },
    { module: motionText, src: motionTextSrc },
    { module: flip, src: flipSrc },
    { module: motionCss, src: motionCssSrc },
  ],
  navigation: [{ module: navigation, src: navigationSrc }],
  overlays: [{ module: overlays, src: overlaysSrc }],
  saudi: [{ module: saudi, src: saudiSrc }],
  "saudi-forms": [{ module: saudiForms, src: saudiFormsSrc }],
  text: [{ module: text, src: textSrc }],
  utilities: [{ module: utilities, src: utilitiesSrc }],
  data: [
    { module: dataTables, src: dataTablesSrc },
    { module: dataItems, src: dataItemsSrc },
    { module: code, src: codeSrc },
  ],
  boards: [{ module: boards, src: boardsSrc }],
  charts: [{ module: charts, src: chartsSrc }],
  app: [
    { module: appShell, src: appShellSrc },
    { module: appForms, src: appFormsSrc },
  ],
  business: [{ module: business, src: businessSrc }],
};

const fileOf = (group: Group, name: string) => EXAMPLES[group].find((e) => name in e.module);
export const exampleComponent = (group: Group, name: string) => fileOf(group, name)?.module[name] as ComponentType | undefined;
/** The source file text that holds an example. */
export const exampleFile = (group: Group, name: string) => fileOf(group, name)?.src ?? "";
