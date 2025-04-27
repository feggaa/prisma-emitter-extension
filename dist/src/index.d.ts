import type { PrismaClient } from '@prisma/client';
export type ListenerFunction<T> = (payload: {
    args: any;
    model: ModelNames;
    result: T;
}) => Promise<void> | void;
export interface ListenerConfig<T> {
    on: Partial<{
        [K in keyof T]: true | T[K][] | ((value: T[K]) => boolean);
    }>;
    listener: ListenerFunction<T>;
}
export type ModelNames = {
    [K in Extract<keyof PrismaClient, string>]: PrismaClient[K] extends {
        findUnique: (...args: any[]) => any;
    } ? K : never;
}[Extract<keyof PrismaClient, string>];
export declare const listeners: Record<ModelNames, ListenerConfig<any>[]>;
/**
 * Register a listener for a model.
 * Returns a function you can call to remove that exact listener.
 */
export declare function addEventListener<T>(model: ModelNames, config: ListenerConfig<T>): () => void;
type ExtensionConfig = Parameters<PrismaClient['$extends']>[0];
export declare function listenerExtensionConfig(): ExtensionConfig;
export {};
