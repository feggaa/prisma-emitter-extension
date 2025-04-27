"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listeners = void 0;
exports.prismaEventListener = prismaEventListener;
exports.listenerExtensionConfig = listenerExtensionConfig;
// Listeners map: model name to array of configs
exports.listeners = {};
/**
 * Register a listener for a model.
 * Returns an unsubscribe function.
 */
function prismaEventListener(model, config) {
    if (!exports.listeners[model])
        exports.listeners[model] = [];
    exports.listeners[model].push(config);
    return () => {
        exports.listeners[model] = exports.listeners[model].filter(l => l !== config);
    };
}
function matches(config, args) {
    const where = !config.where ? true : Object.entries(config.where).every(([field, cond]) => {
        const val = args.where[field];
        if (cond === true)
            return val !== undefined;
        if (cond === val)
            return true;
        if (Array.isArray(cond))
            return cond.includes(val);
        if (typeof cond === 'function')
            return cond(val);
        return false;
    });
    const data = !config.data ? true : Object.entries(config.data).every(([field, cond]) => {
        const val = args.data[field];
        if (cond === true)
            return val !== undefined;
        if (cond === val)
            return true;
        if (Array.isArray(cond))
            return cond.includes(val);
        if (typeof cond === 'function')
            return cond(val);
        return false;
    });
    return where && data;
}
async function runListeners(model, args, result) {
    const configs = exports.listeners[camelize(model)];
    if (!configs)
        return;
    for (const cfg of configs) {
        if (matches(cfg, args)) {
            try {
                await cfg.listener({ args, model, result });
            }
            catch (err) {
                console.error(`Listener for ${model} failed`, err);
            }
        }
    }
}
function listenerExtensionConfig() {
    return {
        name: 'listenerExtension',
        query: {
            $allModels: {
                async update({ args, query, model }) {
                    const doEmit = Boolean(args.emit);
                    delete args.emit;
                    const result = await query(args);
                    if (doEmit)
                        await runListeners(model, args, result);
                    return result;
                },
                async updateMany({ args, query, model }) {
                    const doEmit = Boolean(args.emit);
                    delete args.emit;
                    const result = await query(args);
                    if (doEmit)
                        await runListeners(model, args, result);
                    return result;
                },
                async create({ args, query, model }) {
                    const doEmit = Boolean(args.emit);
                    delete args.emit;
                    const result = await query(args);
                    if (doEmit)
                        await runListeners(model, args, result);
                    return result;
                },
                // async upsert({ args, query, model }: any) {
                //   const doEmit = Boolean((args as any).emit);
                //   delete (args as any).emit;
                //   const result = await query(args);
                //   if (doEmit) await runListeners(model, args, result);
                //   return result;
                // },
            },
        },
    };
}
