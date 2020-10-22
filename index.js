const config = require('./config.json');
const chrono = require('chrono-node');
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', parse);

client.login(config.user_token);

var lastMessage = null;
var lastTime = null;
var interval = null;
var timeout = null;

function parse(message) {
    if(message.content.startsWith('!schedule ')) {
        let now = new Date();
        let time = chrono.parse(message.content, now, { forwardDate: true });
        if(!time[0]) {
            message.reply('could not parse time');
            return;
        }
        if(time[0].date() - now < 0) {
            time[0].start.knownValues.hour += 12;
        }
        lastTime = time[0].date();
        console.log(lastTime);
        lastMessage = message;
        clearInterval(interval);
        clearTimeout(timeout);
        interval = setInterval(checkTime, 60000);
        checkTime();
    }
}

function checkTime() {
    if(lastTime === null) {
        client.user.setActivity('');
        return;
    }
    let future = lastTime - new Date();
    let minutes = Math.ceil(future / 60 / 1000);
    if(minutes < 60) {
        client.user.setActivity('games in ' + minutes + ' minute' + (minutes === 1 ? '' : 's'));
    } else {
        let hours = Math.round(future / 60 / 1000 / 60);
        client.user.setActivity('games in ' + hours + ' hour' + (hours === 1 ? '' : 's'));
    }
    if(future < 60000) {
        clearTimeout(timeout);
        clearInterval(interval);
        setTimeout(ping, future);
    }
}

async function ping() {
    client.user.setActivity();
    let users = lastMessage.reactions.cache.flatMap(u => u.users.cache).mapValues(u => new String(u));
    lastMessage.channel.send(users.reduce((list, user) => list + ' ' + user, 'Game time'));
}

