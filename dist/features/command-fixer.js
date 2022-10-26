"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const tslib_1 = require("tslib");
const utils_1 = require("../include/utils");
const i18n_1 = tslib_1.__importDefault(require("i18n"));
if (utils_1.LOCALE)
    i18n_1.default.setLocale(utils_1.LOCALE);
exports.default = async (client, instance) => {
    const commands = await instance.slashCommands.get();
};
const config = {
    displayName: 'Hides the testing commands',
    dbName: 'COMMAND_FIXER',
};
exports.config = config;
//# sourceMappingURL=command-fixer.js.map