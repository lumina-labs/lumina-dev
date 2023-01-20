import base58 from 'bs58';

export function getFileName(stackLevel: number): string {
  const fileName = new Error()
    .stack!.split('at ')
    [stackLevel]?.match(/\((.*)\:\d+\:\d+\)/)?.[1];

  if (!fileName) {
    throw new Error('Unable to determine test file name');
  }

  return fileName;
}

export function getFirstSignature(encoded: string): string {
  const buffer = Buffer.from(encoded, 'base64');
  const start = buffer.findIndex((byte) => (byte & 0x80) === 0) + 1;
  return base58.encode(buffer.subarray(start, start + 64));
}

export const PATCHED_SET = new WeakSet();
