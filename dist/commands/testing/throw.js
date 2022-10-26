"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    name: 'throw',
    description: 'Throws an uncaught exception to crash the bot',
    category: 'testing',
    testOnly: true,
    ownerOnly: true,
    slash: true,
    permissions: ['ADMINISTRATOR'],
    async callback() {
        throw new Error('Forced Crash');
    },
};
//# sourceMappingURL=throw.js.map