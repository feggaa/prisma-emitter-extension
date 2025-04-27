import type { PrismaClient } from '@prisma/client';
export type ListenerFunction<T> = (payload: {
    args: any;
    model: ModelNames;
    result: T;
}) => Promise<void> | void;
export interface ListenerConfig<T> {
    where?: Partial<{
        [K in keyof T]: true | T[K][] | string | ((value: T[K]) => boolean);
    }>;
    data?: Record<string, any>;
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
 * Returns an unsubscribe function.
 */
export declare function prismaEventListener<T>(model: ModelNames, config: ListenerConfig<T>): () => void;
type ExtensionConfig = Parameters<PrismaClient['$extends']>[0];
export declare function listenerExtensionConfig(): ExtensionConfig;
export {};
