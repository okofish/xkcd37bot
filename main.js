var botName = process.env.username;

var rawjs = require('raw.js');
var reddit = new rawjs(botName);

var redis = require("redis");
var redisclient = redis.createClient();
var RedditStream = require('reddit-stream');
var comment_stream = new RedditStream('comments', 'xkcd', 'bot/' + botName)

var auth = {
  username: botName,
  password: process.env.password,
  app: {
    id: process.env.appkey,
    secret: process.env.secret
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
          console.log(comment.data.body);
          if (process.argv[2] != "-todate") {
            var fullmatch = /(\w*?)-ass (.*?)(?=[.,?!;])/
            var cutmatch = /(\w*?)-ass (.*?)/
            if (fullmatch.test(comment.data.body)) {
              var ftfy = comment.data.body.match(fullmatch)[0].replace(cutmatch, "\*$1 ass-$2")
              console.log(ftfy)
              reddit.comment(comment.data.name, ftfy, function(err, comment) {
                if (err) {
                  console.error(err)
                }
              })
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
