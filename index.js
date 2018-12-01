const slackEventsApi = require('@slack/events-api');
const SlackClient = require('@slack/client').WebClient;
const express = require('express');
let pair = []
const score = require('score.json')

// *** Initialize an Express application
const app = express();

// *** Initialize a client with your access token
const slack = new SlackClient(process.env.SLACK_ACCESS_TOKEN);

// *** Initialize event adapter using signing secret from environment variables ***
const slackEvents = slackEventsApi.createEventAdapter(process.env.SLACK_SIGNING_SECRET);


// Homepage
app.get('/', (req, res) => {
  const url = `https://${req.hostname}/slack/events`;
  res.setHeader('Content-Type', 'text/html');

  return res.send(`<pre>Copy this link to paste into the event URL field: <a href="${url}">${url}</a></pre>`);
});

// *** Plug the event adapter into the express app as middleware ***
app.use('/slack/events', slackEvents.expressMiddleware());

// *** Attach listeners to the event adapter ***

// *** Greeting any user that says "hi" ***
slackEvents.on('app_mention', (message) => {
  console.log(message);
  
  // Put your code here!
  // 
  // What does the `message` object look like?
  // We want to respond when someone says "hello" to the bot  
  
});

// *** Responding to reactions with the same emoji ***
slackEvents.on('reaction_added', (event) => {
  console.log(event);
  // Respond to the reaction back with the same emoji
  
  // Put your code here!
  //
  // What does the `event` object look like?
  // We want to respond when someone reacts to _any_ message
  
});

slackEvents.on('message.channels', (message) => {
  console.log(message);
  
  // Put your code here!
  // 
  // What does the `message` object look like?
  // We want to respond when someone says "hello" to the bot  
  
});
slackEvents.on('message', (message) => {
  if (message.bot_id) return;
  if (message.channel_type != 'im') return;
  console.log(message);
  if(pair.includes(message.channel)){
     //code
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
                if(!score[message.channel]){                score[message.channel] = 0
                fs.writeFile("./score.json", JSON.stringify(score), (err) => {
                    if (err) console.log(err)
                });
                break;
            case('help'):
                message.author.send('Insert help here')
                break;
        }
    //code
  }
     
  slack.chat.postMessage({
    channel: message.channel,
    text: 'what do you want?'
  })
  
  // Put your code here!
  // 
  // What does the `message` object look like?
  // We want to respond when someone says "hello" to the bot  
  
});

// *** Handle errors ***
slackEvents.on('error', (error) => {
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
