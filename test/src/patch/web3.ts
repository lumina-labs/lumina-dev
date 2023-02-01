import type { web3 as Web3 } from '@coral-xyz/anchor';

import type { PatchState, TestState } from '.';
import { getFirstSignature, PATCHED_SET, searchModuleCache } from './util';

export function getWeb3Instances() {
  return searchModuleCache<typeof Web3>('@solana/web3.js', 'Connection');
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
    function (this: typeof Web3.Connection, encoded, options) {
      // Skip preflight so that the transaction can be picked up by the explorer.
      (options ??= {}).skipPreflight = true;

      const signature = getFirstSignature(encoded);
      testState.signatures.unshift(signature);

      return self.apply(this, arguments).finally(() => {
        patchState.recentSignature = signature;
      });
    })(web3.Connection.prototype.sendEncodedTransaction);

  web3.Connection.prototype.confirmTransaction = ((self) =>
    function (this: typeof Web3.Connection, strategy, commitment) {
      // Override commitment to confirmed so that calls to getTransaction
      // return error logs.
      if (!commitment || commitment === 'processed') {
        commitment = 'confirmed';
      }
      return self.call(
        this,
        strategy as Parameters<typeof self>[0],
        commitment,
      );
    })(web3.Connection.prototype.confirmTransaction);
}
