const Chariot = require('chariot.js');

class Immersive extends Chariot.Client {
  constructor() {
    super(new Chariot.Config(
      process.env.DISCORD_TOKEN,
      {
        prefix: '.',
        guildPrefixes: [],
        defaultHelpCommand: false,
        primaryColor: '#eb2738',
        owner: [
          '224379198255529984', // Velo
        ],
      },
    ));
  }
}

module.exports = new Immersive();
