const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class RPSCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'rps',
      aliases: ['rock-paper-scissors', 'rock'],
      group: 'other',
      memberName: 'rps',
      description: 'Rock paper scissors',
      args: [
        {
          key: 'text',
          prompt:
            'You ready for a game of Rock, Paper, Scissors? \n What is your move?',
          type: 'string'
        }
      ]
    });
  }

  run(message) {
    const replies = ['Rock', 'Paper', 'Scissors'];
    const reply = replies[Math.floor(Math.random() * replies.length)];

    const embed = new MessageEmbed()
      .setColor('RANDOM')
      .setTitle('Rock, Paper, Scissors')
      .setDescription(`**${reply}**`);
    message.channel.send(embed);
    return;
  }
};
