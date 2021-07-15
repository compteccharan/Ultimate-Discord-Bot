const { Command } = require('discord.js-commando');

module.exports = class LeaveCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'leave',
      aliases: ['end', 'stop'],
      group: 'music',
      memberName: 'leave',
      guildOnly: true,
      description: 'Leaves voice channel if in one!'
    });
  }

  run(message) {
    var voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      message.reply(':no_entry: Please join a voice channel and try again!');
      return;
    } else if (
      typeof message.guild.musicData.songDispatcher == 'undefined' ||
      message.guild.musicData.songDispatcher == null
    ) {
      if (
        message.guild.musicData.isPlaying == false &&
        message.guild.me.voice.channel
      ) {
        message.guild.me.voice.channel.leave();
      } else {
        message.reply(':x: There is no song playing right now!');
      }
      return;
    } else if (voiceChannel.id !== message.guild.me.voice.channel.id) {
      message.reply(
        `:no_entry: You must be in the same voice channel as the bot in order to use that!`
      );
      return;
    } else if (message.guild.triviaData.isTriviaRunning) {
      message.reply(
        `Use stop-trivia command in order to stop the music trivia!`
      );
    } else if (!message.guild.musicData.queue) {
      message.reply(':x: There are no songs in queue');
      return;
    } else if (message.guild.musicData.songDispatcher.paused) {
      message.guild.musicData.songDispatcher.resume();
      message.guild.musicData.queue.length = 0;
      message.guild.musicData.loopSong = false;
      message.guild.musicData.skipTimer = true;
      setTimeout(() => {
        message.guild.musicData.songDispatcher.end();
      }, 100);
      message.reply(
        `:grey_exclamation: ${this.client.user.username} has left the channel.`
      );
      return;
    } else {
      message.guild.musicData.queue.length = 0;
      message.guild.musicData.skipTimer = true;
      message.guild.musicData.loopSong = false;
      message.guild.musicData.loopQueue = false;
      message.guild.musicData.songDispatcher.end();
      message.reply(
        `:grey_exclamation: ${this.client.user.username} has left the channel.`
      );
      return;
    }
  }
};
