"use strict";
module.exports = {
    name: 'ping',
    category: 'fun',
    description: 'Ping Pong',
    callback({ message }) {
        message.channel.send('Pong');
    },
};
//# sourceMappingURL=ping.js.map