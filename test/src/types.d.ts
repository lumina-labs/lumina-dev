// Adapted from: https://github.com/microsoft/TypeScript/issues/36470#issuecomment-609580763

export declare global {
  interface CallableFunction {
    apply<T, U extends any[], R>(
      this: (this: T, ...args: U) => R,
      thisArg: T,
      args: IArguments,
    ): R;
  }
}
