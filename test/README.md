# @lumina-dev/test

A single-line utility for debugging [Solana](https://github.com/solana-labs/solana) applications.

## Installation

```bash
npm install @lumina-dev/test
```

## Usage

Modify your test file to use the `lumina` utility.

```js
import * as anchor from '@coral-xyz/anchor';
import lumina from '@lumina-dev/test';

// Add this to the top of your test file
lumina();

describe('my-anchor-test', () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.MyProgram;
  // ...
});
```

When running your tests, navigate link in the console to view debug info.

```
⬜ Lumina: View local debug info at https://lumina.fyi/debug
```

## Community

Join the [Lumina Discord](http://discord.gg/e8J6wDwwrq) to chat with the community and team.
