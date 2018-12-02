const slackEventsApi = require('@slack/events-api');
const SlackClient = require('@slack/client').WebClient;
const express = require('express');
const score = require('./score.json');
const report = require('./report.json');
const fs = require('fs');
const request = require('request');
//Authorize users

let pair = []

// *** Initialize an Express application
const app = express();

// *** Initialize a client with your access token
const slack = new SlackClient(process.env.SLACK_ACCESS_TOKEN);

// *** Initialize event adapter using signing secret from environment variables ***
const bot = slackEventsApi.createEventAdapter(process.env.SLACK_SIGNING_SECRET);

//OAuth page
app.get('/auth', function(req, res){ 
  let data = {form: { 
    client_id: process.env.SLACK_CLIENT_ID, 
    client_secret: process.env.SLACK_CLIENT_SECRET, 
    code: req.query.code 
  }}; 
  request.post('https://slack.com/api/oauth.access', data, function (error, response, body) { 
    if (!error && response.statusCode == 200) { 
      // You are done. 
      // If you want to get team info, you need to get the token here 
      let token = JSON.parse(body).access_token;
      request.post('https://slack.com/api/team.info', {form: {token: token}}, function (error, response, body) { 
      if (!error && response.statusCode == 200) { 
      let team = JSON.parse(body).team.domain; 
      res.redirect('http://' +team+ '.slack.com'); 
  } 
});// Auth token 
    } 
  })
});

// Homepage
app.get('/', (req, res) => {
  const url = `https://${req.hostname}/slack/events`;
  res.setHeader('Content-Type', 'text/html');

  return res.send(`<pre>Copy this link to paste into the event URL field: <a href="${url}">${url}</a></pre>`);
});

// *** Plug the event adapter into the express app as middleware ***
app.use('/slack/events', bot.expressMiddleware());

// *** Attach listeners to the event adapter ***

// *** Greeting any user that says "hi" ***
bot.on('app_mention', (message) => {
  console.log(message);
  
  // Put your code here!
  // 
  // What does the `message` object look like?
  // We want to respond when someone says "hello" to the bot  
  
});

// *** Responding to reactions with the same emoji ***
bot.on('reaction_added', (event) => {
  console.log(event);
  // Respond to the reaction back with the same emoji
  
  // Put your code here!
  //
  // What does the `event` object look like?
  // We want to respond when someone reacts to _any_ message
  
});

bot.on('message.channels', (message) => {
  console.log(message);
  
  // Put your code here!
  // 
  // What does the `message` object look like?
  // We want to respond when someone says "hello" to the bot  
  
});
bot.on('message', (message) => {
  if (message.bot_id) return;
  function send(c,m) {
    slack.chat.postMessage({
      channel: c,
      text: m
    })
  }
  if (message.text == 'help'){
    send(message.channel,'To begin, type `!pair` to get paired to a partner. \n \
Once you are paired, you can type `!leave` at any time to leave the conversation. \n \
If you would like to report your partner for inappropriate comments, type `!report`.')
     return;
  }
  if(pair.includes(message.channel)){
    let index = pair.findIndex(i=> i==message.channel)

    if(index+1==pair.length&&pair.length%2 == 1) return;
    let partner = 0;
    if(index%2 == 0){
      partner = index+1;
    } else {
      partner = index-1;
    }
    switch(message.text){
      case('!leave'):
        score[pair[index]] += 5
        score[pair[partner]] += 5
        send(pair[index],'You have left the chat, you have earned 5 points')
        send(pair[partner],'Your partner has left the chat, you have earned 5 points')
        if(index%2 == 0){
          pair.splice(index,2)
        } else {
          pair.splice(index-1,2)
        }
        fs.writeFile("./score.json", JSON.stringify(score), (err) => {
              if (err) console.log(err)
        });
        break;
      case('!report'):
        if(!report[pair[partner]]){
            report[pair[partner]] = 1
        } else {
            report[pair[partner]] += 1
        }
        score[pair[index]] += 1
        send(pair[index],'User reported, you have earned 1 points')
        send(pair[partner],'You have been reported, conversation terminated')
        if(index%2 == 0){
          pair.splice(index,2)
        } else {
          pair.splice(partner,2)
        }
        fs.writeFile("./report.json", JSON.stringify(report), (err) => {
                if (err) console.log(err)
        });
        break;
      default:
        send(pair[partner],message.text);
    }
  } else {
    switch(message.text){
      case('!pair'):
        if(report[message.channel]){
          if (report[message.channel] > 4) {
            return send(message.channel, "You have been banned from using this feature.")
          }
        }
        pair.push(message.channel)
        if(pair.length%2 == 1){
          send(message.channel,'Please wait to be paired')
        } else {
          send(message.channel,'You have been paired. Type `!leave` at any time to leave the conversation. \n \
                    If you would like to report your partner for inappropriate comments, type `!report`.')
          send(pair[pair.length-2],'You have been paired. Type `!leave` at any time to leave the conversation. \n \
                    If you would like to report your partner for inappropriate comments, type `!report`.')
        }
        if(!score[message.channel]){
          score[message.channel] = 0
          fs.writeFile("./score.json", JSON.stringify(score), (err) => {
              if (err) console.log(err)
          });
        }
        break;
      case('!points'):
        if(!score[message.channel]){
          score[message.channel] = 0
          fs.writeFile("./score.json", JSON.stringify(score), (err) => {
              if (err) console.log(err)
          });
        }
        send(message.channel, 'You have ' + score[message.channel] + ' points')
        break;
      default:
        send(message.channel, 'Sorry, I did not understand that. Type `help` for help or type `!pair` to get matched.')        
    }
  }
  
});

// *** Handle errors ***
bot.on('error', (error) => {
  if (error.code === slackEventsApi.errorCodes.TOKEN_VERIFICATION_FAILURE) {
    // This error noetype also has a `body` propery containing the request body which failed verification.
    console.error(`An unverified request was sent to the Slack events Request URL. Request body: \
${JSON.stringify(error.body)}`);
  } else {
    console.error(`An error occurred while handling a Slack event: ${error.message}`);
  }
});

// Start the express application
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});

