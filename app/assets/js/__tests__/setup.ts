import { TextDecoder, TextEncoder } from "util";

// React Router uses the encoding APIs that jsdom does not provide.
Object.assign(globalThis, { TextDecoder, TextEncoder });
