/* istanbul ignore file */
export * from './query';
export * from './transformers';
export {
  /**
   * @deprecated Import from 'swipl-wasm' instead.
   */
  default as SWIPL,
} from 'swipl-wasm';
export { default as EYE_PVM } from './eye';
