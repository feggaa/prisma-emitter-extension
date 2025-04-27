# Prisma Emitter Extension

[![npm version](https://img.shields.io/npm/v/prisma-emitter-extension)](https://www.npmjs.com/package/prisma-emitter-extension)
[![npm downloads](https://img.shields.io/npm/dm/prisma-emitter-extension)](https://www.npmjs.com/package/prisma-emitter-extension)
[![license](https://img.shields.io/npm/l/prisma-emitter-extension)](https://github.com/feggaa/prisma-emitter-extension/blob/main/LICENSE)


A lightweight Prisma extension for registering conditional listeners and emitting events on any model’s CRUD operations.

## Prerequisites

- Node.js ≥ 16
- prisma v4.16.0 or higher
- @prisma/client

## Installation

```bash
npm install prisma-emitter-extension
```
> **Note:** Currently only the Prisma operations `create`, `update`, and `updateMany` support `emit` and listener emission.

## Usage

```ts
import { PrismaClient } from '@prisma/client';
import { listenerExtensionConfig, prismaEventListener } from 'prisma-emitter-extension';

// 1) Extend the Prisma client
export const prisma = new PrismaClient().$extends(
  listenerExtensionConfig()
);

// 2) Register a listener
prismaEventListener('User', {
  where: { id: 1 },
  data: { status: ['ACTIVE', 'BLOCKED'] },
  listener: async ({ result }) => {
    console.log(`User #${result.id} → status ${result.status}`);
  },
});

// 3) Trigger events by setting `emit: true` (default is `false`; you must set this flag to `true` to enable listener emission)
await prisma.user.update({
  where: { id: 1 },
  data: { status: 'ACTIVE' },
  emit: true, // <– important: listeners only fire when `emit` is `true`
});
```

## Examples

**Matching data only** — list on users with **ACTIVE** only
```ts
prismaEventListener('User', {
  data: { status: 'ACTIVE' },
  listener: async ({ result }) => {
    console.log('User #' + result.id + ' status changed to ' + result.status);
  },
});
```

**Any status** — listen to all users regardless of status
```ts
prismaEventListener('User', {
  data: { status: true },
  listener: async ({ result }) => {
    console.log('User #' + result.id + ' status changed to ' + result.status);
  },
});
```

**Multiple statuses** — listen to **ACTIVE** or **BLOCKED**
```ts
prismaEventListener('User', {
  data: { status: ['ACTIVE', 'BLOCKED'] },
  listener: async ({ result }) => {
    console.log('User #' + result.id + ' status changed to ' + result.status);
  },
});
```





### `prismaEventListener(modelName, config)`

Registers a conditional listener:

- `modelName: string` – the Prisma model (e.g., `'User'`).
- `config.where?: object` – optional `where` filter (string, array, boolean, or predicate callback).
- `config.data?: object` – optional `data` filter (string, array, boolean, or predicate callback).
- `config.listener: (args: { result: any }) => void` – callback invoked when conditions match.

## CLI: Generate Emit Types

To annotate all CRUD args with `emit?: boolean`, run:

```bash
npx prisma-emitter generate \
  --schema=./prisma/schema.prisma \
  --output=./types
```

Then include the generated `types/prisma-emit.d.ts` in your `tsconfig.json` so TypeScript picks it up.

