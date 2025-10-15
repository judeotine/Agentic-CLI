#!/usr/bin/env node

import { CLI } from './cli';

async function main() {
  const cli = new CLI();
  await cli.run(process.argv);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

