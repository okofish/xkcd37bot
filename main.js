//require("./envar.js")  //for running locally, define envars in a seperate file
var botName = process.env.XKCD37BOT_USERNAME;

var rawjs = require('raw.js');

var reddit = new rawjs(botName);

var redis = require("redis");
var url = require('url');
var redisURL = url.parse(process.env.REDIS_URL);
var redisclient = redis.createClient(redisURL.port, redisURL.hostname);
redisclient.auth(redisURL.auth.split(":")[1]);;
//var RedditStream = require('reddit-stream');
var RedditStream = require('./reddit-stream.js');
var comment_stream = new RedditStream('comments', 'xkcd', 'bot/' + botName)

var auth = {
  username: botName,
  password: process.env.XKCD37BOT_PASSWORD,
  app: {
    id: process.env.XKCD37BOT_APPKEY,
    secret: process.env.XKCD37BOT_SECRET
  }
}

reddit.setupOAuth2(auth.app.id, auth.app.secret);

reddit.auth({
  "username": auth.username,
  "password": auth.password
}, function(err, response) {
  if (err) {
    console.error("Unable to authenticate user: " + err);
  } else {
    comment_stream.login(auth).then(function() {
      console.log('logged in for comment stream');
      comment_stream.start();
    }, function() {
      return console.error('failed to log in!');
    });
  }
});

function processComment(comment, index, array) {
  if (comment.data.author != botName) {

    redisclient.exists(comment.data.name, function(err, exists) {
      if (err) {
        console.error(err)
      } else {
        if (exists == 0) {
          //console.log(comment.data.body);
          if (process.argv[2] != "-todate" || process.env.ARGS != "todate") { // bringing the empty redis db "to date" when the bot is started for the first time
            var regex = /(\w*?)-ass (\w+)/i
            if (regex.test(comment.data.body)) {
              console.log(comment.data.body);
              var ftfy = comment.data.body.match(regex)[0].replace(regex, "\\\*$1 ass-$2")
              console.log(ftfy)
              if (process.argv[2] != "-declaw" || process.env.ARGS != "declaw") {
                reddit.comment(comment.data.name, ftfy, function(err, comment) {
                  if (err) {
                    console.error(err)
                  }
                })
              }
            }
          }

          redisclient.set(comment.data.name, "read")
        }
      }
    })
  }
}

comment_stream.on('new', function(comments) {
  comments.forEach(processComment)
});
