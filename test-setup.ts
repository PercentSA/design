import { GlobalRegistrator } from "@happy-dom/global-registrator";

// happy-dom replaces fetch with its own (browser rules, 127.0.0.1 only); tests that call a real server need Bun's.
const native = { fetch, Request, Response, Headers };
GlobalRegistrator.register({ url: "http://localhost/" });
Object.assign(globalThis, native);
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
