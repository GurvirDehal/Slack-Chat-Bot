const slackEventsApi = require('@slack/events-api');
const SlackClient = require('@slack/client').WebClient;
const express = require('express');
let pair = []
const score = require('./score.json')
const fs = require('fs');

// *** Initialize an Express application
const app = express();

// *** Initialize a client with your access token
const slack = new SlackClient(process.env.SLACK_ACCESS_TOKEN);

// *** Initialize event adapter using signing secret from environment variables ***
const bot = slackEventsApi.createEventAdapter(process.env.SLACK_SIGNING_SECRET);


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
  console.log(message);
  console.log(pair);
  if(pair.includes(message.channel)){
     let index = pair.findIndex(i=> i==message.channel)
        if(index+1==pair.length&&pair.length%2 == 1) return;
        if(message.text=='leave'){
          //code
        }
        if(index%2 == 0){
            slack.chat.postMessage({
              channel: pair[index + 1],
              text: message.text
            })
        } else {
            slack.chat.postMessage({
              channel: pair[index - 1],
              text: message.text
            })
        }
  } else {
    switch(message.text){
            case('pair'):
                pair.push(message.channel)
                if(pair.length%2 == 1){
                    slack.chat.postMessage({
                      channel: message.channel,
                      text: 'Please wait to be paired'
                    })
                } else {
                    slack.chat.postMessage({
                      channel: message.channel,
                      text: 'You have been paired'
                    })
                    slack.chat.postMessage({
                      channel: pair[pair.length-2],
                      text: 'You have been paired'
                    })
                }
                if(!score[message.channel]){
                  score[message.channel] = 0
                  fs.writeFile("./score.json", JSON.stringify(score), (err) => {
                      if (err) console.log(err)
                  });
                }
                break;
            case('help'):
                slack.chat.postMessage({
                      channel: message.channel,
                      text: 'To begin, type "pair".'
                    })
                break;
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
