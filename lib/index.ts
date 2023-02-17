/// <reference types="emscripten" />

import type { SWIPLModule } from 'swipl-wasm/dist/common';
// @ts-ignore
import SWIPL_BUNDLE from './swipl-bundled.temp';

export * from './query';
export * from './transformers';
// eslint-disable-next-line no-unused-vars
export const SWIPL: (options?: Partial<EmscriptenModule>) => Promise<SWIPLModule> = SWIPL_BUNDLE;

export { default as EYE_PVM } from './eye';
