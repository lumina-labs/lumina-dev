import type * as Anchor from '@coral-xyz/anchor';
import type * as MethodsModule from '@coral-xyz/anchor/dist/cjs/program/namespace/methods';
import type * as RpcModule from '@coral-xyz/anchor/dist/cjs/program/namespace/rpc';
import type { MethodsBuilder as MethodsBuilderClass } from '@coral-xyz/anchor/dist/cjs/program/namespace/methods';
import type RpcFactoryClass from '@coral-xyz/anchor/dist/cjs/program/namespace/rpc';

import type { PatchState, TestState } from '.';
import { getOnly, searchModuleCache } from './util';
import { patchWeb3 } from './web3';

export interface AnchorObjects {
  anchor: typeof Anchor;
  MethodsBuilder: typeof MethodsBuilderClass;
  RpcFactory: typeof RpcFactoryClass;
}

export function getAnchorObjectsFromModule(name: string): AnchorObjects {
  return {
    anchor: getOnly(searchModuleCache<typeof Anchor>(name, 'workspace')),
    MethodsBuilder: getOnly(
      searchModuleCache<typeof MethodsModule>(
        `${name}/dist/cjs/program/namespace/methods`,
        'MethodsBuilder',
      ),
    ).MethodsBuilder,
    RpcFactory: getOnly(
      searchModuleCache<typeof RpcModule>(
        `${name}/dist/cjs/program/namespace/rpc`,
        'default',
      ),
    ).default,
  };
}

export function getAnchorObjects(): AnchorObjects {
  // IMPORTANT: start with @project-serum/anchor, then fallback to @coral-xyz/anchor
  // as @coral-xyz/anchor always exists in the project due to the dev dependency
  try {
    return getAnchorObjectsFromModule('@project-serum/anchor');
  } catch (e) {
    return getAnchorObjectsFromModule('@coral-xyz/anchor');
  }
}

function buildSourceProxy<T, R>(
  fn: (this: T) => Promise<R>,
  testState: TestState,
  patchState: PatchState,
): typeof fn {
  return function (this: T) {
    const stack = new Error().stack!;

    return fn.apply(this, arguments).finally(() => {
      const line = stack
        .split('at ')
        .find((line) => line.includes(testState.fileName))
        ?.match(/([^\)]*)\:(\d+)\:(\d+)/);

      if (patchState.recentSignature && line) {
        testState.sourceMap[patchState.recentSignature] = {
          fileName: line[1]!,
          lineNumber: Number(line[2]),
          colNumber: Number(line[3]),
        };
      }
    });
  };
}

export function patchAnchorObjects(
  { anchor, RpcFactory, MethodsBuilder }: AnchorObjects,
  testState: TestState,
  patchState: PatchState = { recentSignature: undefined },
) {
  patchWeb3(anchor.web3, testState, patchState);

  RpcFactory.build = ((self) =>
    function (this: typeof RpcFactory) {
      return buildSourceProxy(
        self.apply(this, arguments),
        testState,
        patchState,
      );
    })(RpcFactory.build);

  MethodsBuilder.prototype.rpc = buildSourceProxy(
    MethodsBuilder.prototype.rpc,
    testState,
    patchState,
  );

  anchor.workspace._;
  for (const program of Object.values<Anchor.Program<any>>(anchor.workspace)) {
    testState.idlMap[String(program.programId)] = program.idl;
  }
}
