import type { web3 as Web3 } from '@coral-xyz/anchor';

import type { PatchState, TestState } from '.';
import { getFirstSignature, PATCHED_SET } from './util';

export function getWeb3Instances() {
  return Object.values(require.cache)
    .filter((m): m is NodeModule => !!m)
    .filter(({ id }) => id.includes('@solana/web3.js'))
    .map((m) => m.exports)
    .filter((m): m is typeof Web3 => m?.Connection);
}

export function patchWeb3(
  web3: typeof Web3,
  testState: TestState,
  patchState: PatchState = { recentSignature: undefined },
) {
  // Prevent patching the same web3 instance multiple times
  if (PATCHED_SET.has(web3)) {
    return;
  }

  PATCHED_SET.add(web3);

  web3.Connection.prototype.sendEncodedTransaction = ((self) =>
    function (
      this: typeof Web3.Connection,
      encoded: string,
      options?: Web3.SendOptions,
    ) {
      (options ??= {}).skipPreflight = true;

      const signature = getFirstSignature(encoded);
      testState.signatures.unshift(signature);

      return self.apply(this, arguments).finally(() => {
        patchState.recentSignature = signature;
      });
    })(web3.Connection.prototype.sendEncodedTransaction);
}
