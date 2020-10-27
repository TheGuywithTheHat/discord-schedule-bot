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
    if(message.content === '!schedule clear') {
        clear();
    } else if(message.content.includes('!schedule ')) {
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
        message.reply('sending notification in ' + durationToString(lastTime - now));
        console.log(lastTime);
        lastMessage = message;
        clear();
        interval = setInterval(checkTime, 60000);
        checkTime();
    }
}

function durationToString(duration) {
    let output = '';
    let minutes = Math.ceil(duration / 60 / 1000);
    if(minutes >= 60) {
        let hours = Math.floor(minutes / 60);
        output = hours + ' hour' + (hours === 1 ? '' : 's')
        minutes -= hours * 60;
        if(minutes > 0) {
            output += ', ' + minutes + ' minute' + (minutes === 1 ? '' : 's');
        }
    } else {
        output = minutes + ' minute' + (minutes === 1 ? '' : 's')
    }
    return output;
}

function clear() {
    clearInterval(interval);
    clearTimeout(timeout);
}

function checkTime() {
    if(lastTime === null) {
        client.user.setActivity('');
        return;
    }
    let future = lastTime - new Date();
    client.user.setActivity('games in ' + durationToString(future));
    if(future < 60000) {
        clear();
        setTimeout(ping, future);
    }
}

async function ping() {
    client.user.setActivity();
    let users = lastMessage.reactions.cache.flatMap(u => u.users.cache).mapValues(u => new String(u));
    lastMessage.channel.send(users.reduce((list, user) => list + ' ' + user, 'Game time'));
}

