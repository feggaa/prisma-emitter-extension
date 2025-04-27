"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listeners = void 0;
exports.addEventListener = addEventListener;
exports.listenerExtensionConfig = listenerExtensionConfig;
// Listeners map: model name to array of configs
exports.listeners = {};
/**
 * Register a listener for a model.
 * Returns a function you can call to remove that exact listener.
 */
function addEventListener(model, config) {
    if (!exports.listeners[model])
        exports.listeners[model] = [];
    exports.listeners[model].push(config);
    // Return unsubscribe:
    return () => {
        exports.listeners[model] = exports.listeners[model].filter(l => l !== config);
    };
}
function matches(config, args) {
    return Object.entries(config.on).every(([field, cond]) => {
        const val = args.data[field];
        if (cond === true)
            return val !== undefined;
        if (Array.isArray(cond))
            return cond.includes(val);
        if (typeof cond === 'function')
            return cond(val);
        return false;
    });
}
async function runListeners(model, args, result) {
    const configs = exports.listeners[model];
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
                async create({ args, query, model }) {
                    const doEmit = Boolean(args.emit);
                    delete args.emit;
                    const result = await query(args);
                    if (doEmit)
                        await runListeners(model, args, result);
                    return result;
                },
                async upsert({ args, query, model }) {
                    const doEmit = Boolean(args.emit);
                    delete args.emit;
                    const result = await query(args);
                    if (doEmit)
                        await runListeners(model, args, result);
                    return result;
                },
            },
        },
    };
}
