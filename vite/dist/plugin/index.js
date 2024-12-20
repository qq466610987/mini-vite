import { htmlPlugin } from './htmlPlugin.js';
import { modulePlugin } from './modulePlugin.js';
import { cssPlugin } from './cssPlugin.js';
import { vuePlugin } from './vuePlugin.js';
export const plugins = (ctx) => {
    return [htmlPlugin, modulePlugin, cssPlugin, vuePlugin];
};
//# sourceMappingURL=index.js.map