import type * as Anchor from '@coral-xyz/anchor';
import { getAnchorObjects, patchAnchorObjects } from './anchor';
import { getFileName } from './util';
import { getWeb3Instances, patchWeb3 } from './web3';

export interface Source {
  fileName: string;
  lineNumber: number;
  colNumber: number;
}
export type SourceMap = Record<string, Source>;
export type IdlMap = Record<string, Anchor.Idl>;

export interface TestState {
  fileName: string;
  idlMap: IdlMap;
  sourceMap: SourceMap;
  signatures: string[];
}

export interface PatchState {
  recentSignature: string | undefined;
}

export default function patch(): TestState {
  const fileName = getFileName(4);
  const anchorObjects = getAnchorObjects();
  const web3Instances = getWeb3Instances();

  const testState: TestState = {
    fileName,
    idlMap: {},
    sourceMap: {},
    signatures: [],
  };

  // IMPORTANT: must patch anchor objects first, to bind the web3 instance within anchor
  // to the other patched anchor objects
  patchAnchorObjects(anchorObjects, testState);
  for (const web3 of web3Instances) {
    patchWeb3(web3, testState);
  }

  return testState;
}
