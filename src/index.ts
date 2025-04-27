import type { PrismaClient } from '@prisma/client';

export type ListenerFunction<T> = (payload: {
  args: any;
  model: ModelNames;
  result: T;
}) => Promise<void> | void;

export interface ListenerConfig<T> {
  where? : Partial<{ [K in keyof T]: true | T[K][] | string | ((value: T[K]) => boolean) }>;
  data?  : Record<string, any>;
  listener: ListenerFunction<T>;
}

// Derive model names from PrismaClient delegates
export type ModelNames = {
  [K in Extract<keyof PrismaClient, string>]: 
    PrismaClient[K] extends { findUnique: (...args: any[]) => any } ? K : never
}[Extract<keyof PrismaClient, string>];

// Listeners map: model name to array of configs
export const listeners: Record<ModelNames, ListenerConfig<any>[]> = {} as any;

/**
 * Register a listener for a model.
 * Returns an unsubscribe function.
 */
export function prismaEventListener<T>(
  model: ModelNames,
  config: ListenerConfig<T>
): () => void {
  if (!listeners[model]) listeners[model] = [];
  listeners[model].push(config as any);
  return () => {
    listeners[model] = listeners[model].filter(l => l !== (config as any));
  };
}

function matches<T>(config: ListenerConfig<T>, args: any): boolean {
  const where =  !config.where ? true : (Object.entries(config.where) as [keyof T,true | T[keyof T][] | ((v: any) => boolean)][]).every(([field, cond]) => {
    const val = args.where[field];
    if (cond === true) return val !== undefined;
    if (cond === val) return true;
    if (Array.isArray(cond)) return cond.includes(val);
    if (typeof cond === 'function') return (cond as (v: any) => boolean)(val);
    return false;
  });

  const data =  !config.data ? true : (Object.entries(config.data) as [keyof T,true | T[keyof T][] | ((v: any) => boolean)][]).every(([field, cond]) => {
    const val = args.data[field];
    if (cond === true) return val !== undefined;
    if (cond === val) return true;
    if (Array.isArray(cond)) return cond.includes(val);
    if (typeof cond === 'function') return (cond as (v: any) => boolean)(val);
    return false;
  });

  return where && data
}

async function runListeners<T>(model: ModelNames, args: any, result: T) {
  const configs = listeners[camelize(model)];
  if (!configs) return;
  for (const cfg of configs) {
    if (matches(cfg, args)) {
      try {
        await cfg.listener({ args, model, result });
      } catch (err) {
        console.error(`Listener for ${model} failed`, err);
      }
    }
  }
}

type ExtensionConfig = Parameters<PrismaClient['$extends']>[0];

export function listenerExtensionConfig(): ExtensionConfig {
  return {
    name: 'listenerExtension',
    query: {
      $allModels: {
        async update({ args, query, model }: any) {
          const doEmit = Boolean((args as any).emit);
          delete (args as any).emit;
          const result = await query(args);
          if (doEmit) await runListeners(model, args, result);
          return result;
        },
        async updateMany({ args, query, model } : any) {
          const doEmit = Boolean((args as any).emit)
          delete (args as any).emit
          const result = await query(args)
          if (doEmit) await runListeners(model, args, result)
          return result
        },
        async create({ args, query, model }: any) {
          const doEmit = Boolean((args as any).emit);
          delete (args as any).emit;
          const result = await query(args);
          if (doEmit) await runListeners(model, args, result);
          return result;
        },
        async upsert({ args, query, model }: any) {
          const doEmit = Boolean((args as any).emit);
          delete (args as any).emit;
          const result = await query(args);
          if (doEmit) await runListeners(model, args, result);
          return result;
        },
      },
    },
  };
}
