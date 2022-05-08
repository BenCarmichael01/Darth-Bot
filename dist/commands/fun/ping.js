// const oneLine = require('common-tags').oneLine;
module.exports = {
    name: 'ping',
    category: 'fun',
    description: 'Ping Pong',
    callback: function (_a) {
        var message = _a.message;
        message.channel.send('Pong');
    },
};
