const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const Pagination = require('discord-paginationembed');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { geniusLyricsAPI } = require('../../config.json');

// Skips loading if not found in config.json
if (!geniusLyricsAPI) return;

module.exports = class LyricsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'lyrics',
      memberName: 'lyrics',
      aliases: ['lr'],
      description:
        'Get lyrics of any song or the lyrics of the currently playing song!',
      group: 'music',
      throttling: {
        usages: 1,
        duration: 10
      },
      args: [
        {
          key: 'songName',
          default: '',
          type: 'string',
          prompt: ':mag: What song lyrics would you like to get?'
        }
      ]
    });
  }
  async run(message, { songName }) {
    if (
      songName == '' &&
      message.guild.musicData.isPlaying &&
      !message.guild.triviaData.isTriviaRunning
    ) {
      songName = message.guild.musicData.nowPlaying.title;
    } else if (songName == '' && message.guild.triviaData.isTriviaRunning) {
      message.reply(':x: Please try again after the trivia has ended');
      return;
    } else if (songName == '' && !message.guild.musicData.isPlaying) {
      message.reply(
        ':no_entry: There is no song playing right now, please try again with a song name or play a song first!'
      );
      return;
    }

    const sentMessage = await message.channel.send(
      ':mag: :notes: Searching for lyrics!'
    );

    try {
      const url = await LyricsCommand.searchSong(
        LyricsCommand.cleanSongName(songName)
      );
      const songPageURL = await LyricsCommand.getSongPageURL(url);
      const lyrics = await LyricsCommand.getLyrics(songPageURL);

      const lyricsIndex = Math.round(lyrics.length / 2048) + 1;
      const lyricsArray = [];

      for (let i = 1; i <= lyricsIndex; ++i) {
        let b = i - 1;
        if (lyrics.trim().slice(b * 2048, i * 2048).length !== 0) {
          lyricsArray.push(
            new MessageEmbed()
              .setTitle(`Lyrics Page #` + i)
              .setDescription(lyrics.slice(b * 2048, i * 2048))
              .setFooter('Provided by genius.com')
          );
        }
      }

      const lyricsEmbed = new Pagination.Embeds()
        .setArray(lyricsArray)
        .setAuthorizedUsers([message.author.id])
        .setChannel(message.channel)
        .setURL(songPageURL)
        .setColor('#00724E');

      return sentMessage
        .edit(':white_check_mark: Lyrics Found!', lyricsEmbed.build())
        .then(msg => {
          msg.delete({ timeout: 2000 });
        });
    } catch (err) {
      message.reply(err);
    }
  }

  static cleanSongName(songName) {
    return songName
      .replace(/ *\([^)]*\) */g, '')
      .replace(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
        ''
      );
  }

  static searchSong(query) {
    return new Promise(async function(resolve, reject) {
      const searchURL = `https://api.genius.com/search?q=${encodeURI(query)}`;
      const headers = {
        Authorization: `Bearer ${geniusLyricsAPI}`
      };
      try {
        const body = await fetch(searchURL, { headers });
        const result = await body.json();
        const songPath = result.response.hits[0].result.api_path;
        resolve(`https://api.genius.com${songPath}`);
      } catch (e) {
        reject(':x: No song has been found for this query');
      }
    });
  }

  static getSongPageURL(url) {
    return new Promise(async function(resolve, reject) {
      const headers = {
        Authorization: `Bearer ${geniusLyricsAPI}`
      };
      try {
        const body = await fetch(url, { headers });
        const result = await body.json();
        if (!result.response.song.url) {
          reject(':x: There was a problem finding a URL for this song');
        } else {
          resolve(result.response.song.url);
        }
      } catch (e) {
        console.log(e);
        reject('There was a problem finding a URL for this song');
      }
    });
  }

  static getLyrics(url) {
    return new Promise(async function(resolve, reject) {
      try {
        const response = await fetch(url);
        const text = await response.text();
        const $ = cheerio.load(text);
        let lyrics = $('.lyrics')
          .text()
          .trim();
        if (!lyrics) {
          $('.Lyrics__Container-sc-1ynbvzw-6')
            .find('br')
            .replaceWith('\n');
          lyrics = $('.Lyrics__Container-sc-1ynbvzw-6').text();
          if (!lyrics) {
            reject(
              'There was a problem fetching lyrics for this song, please try again'
            );
          } else {
            resolve(lyrics.replace(/(\[.+\])/g, ''));
          }
        } else {
          resolve(lyrics.replace(/(\[.+\])/g, ''));
        }
      } catch (e) {
        console.log(e);
        reject(
          'There was a problem fetching lyrics for this song, please try again'
        );
      }
    });
  }
};
