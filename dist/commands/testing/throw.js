"use strict";
module.exports = {
    name: 'throw',
    description: 'throws unhandled error to crash the bot',
    category: 'testing',
    testOnly: true,
    ownerOnly: true,
    permissions: ['ADMINISTRATOR'],
    async callback() {
        throw console.error();
    },
};
//# sourceMappingURL=throw.js.map