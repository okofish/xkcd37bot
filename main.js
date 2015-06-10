//require("./envar.js")  // for running locally, define envars in a seperate file
var botName = process.env.XKCD37BOT_USERNAME;
var mode = "whitelist"; // set to blacklist, whitelist, or none
var blacklist = ['depression','suicidewatch','selfharm']; // when blacklist mode is enabled, this is a list of subreddits not to respond in
// when whitelist mode is enabled, this is a list of the only subreddits to respond in
var whitelist = ['4chan','xkcd','abandonedporn','android','animalsbeingjerks','art','askhistorians','bitcoin','conservative','crazyideas','diy','daftpunk','doesanybodyelse','dota2','dundermifflin','earthporn','fallout','fantheories','fiftyfifty','fitness','foodporn','frugal','games','getmotivated','himym','historyporn','iama','imgoingtohellforthis','jokes','justiceporn','kerbalspaceprogram','libertarian','lifeprotips','mma','murica','makeupaddiction','mapporn','mensrights','military','minecraft','morbidreality','music','naruto','oldschoolcool','pareidolia','perfecttiming','planetside','prettygirls','quotesporn','random_acts_of_amazon','redditlaqueristas','roomporn','squaredcircle','starwars','talesfromretail','thelastairbender','thesimpsons','trollxchromosomes','truereddit','tumblrinaction','twoxchromosomes','unexpected','wtf','youshouldknow','adventuretime','anime','announcements','apple','arresteddevelopment','askscience','atheism','australia','aww','awwnime','baseball','batman','battlefield3','bestof','bicycling','blog','breakingbad','britishproblems','canada','carporn','cats','circlejerk','comicbooks','comics','community','conspiracy','corgi','cosplay','creepy','creepypms','cringe','cringepics','darksouls','doctorwho','drunk','explainlikeimfive','facepalm','fatpeoplestories','fffffffuuuuuuuuuuuu','firstworldanarchists','food','formula1','funny','futurama','gamegrumps','gameofthrones','gaming','gaybros','geek','guns','harrypotter','hiphopheads','hockey','itookapicture','leagueoflegends','lgbt','lifehacks','longboarding','loseit','magictcg','masseffect','mildlyinfuriating','mildlyinteresting','mindcrack','motorcycles','movies','music','mylittlepony','nba','news','nfl','nosleep','nostalgia','nottheonion','offbeat','onetruegod','pettyrevenge','photoshopbattles','pics','pokemon','polandball','politics','programming','progresspics','rage','reactiongifs','roosterteeth','science','sex','skyrim','soccer','space','starcraft','startrek','tattoos','technology','techsupportgore','teenagers','tf2','thewalkingdead','todayilearned','toronto','trees','tumblr','unitedkingdom','videos','wallpapers','wheredidthesodago','woahdude','worldnews','wow','youtubehaiku','zelda']

var rawjs = require('raw.js');

var reddit = new rawjs(botName);

var redis = require("redis");
var url = require('url');
var redisURL = url.parse(process.env.REDIS_URL);
var redisclient = redis.createClient(redisURL.port, redisURL.hostname);
redisclient.auth(redisURL.auth.split(":")[1]);;
//var RedditStream = require('reddit-stream');
var RedditStream = require('./reddit-stream.js');
var comment_stream = new RedditStream('comments', 'all', 'bot/' + botName) // set the second argument to 'all' for blacklist/whitelist to function, or a single subreddit to only respond there. if you choose a single subreddit, make sure to set mode to none.

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
  if (comment.data.author != botName && ((mode == 'blacklist' && blacklist.indexOf(comment.data.subreddit.toLowerCase()) == -1) || (mode == 'whitelist' && whitelist.indexOf(comment.data.subreddit.toLowerCase()) != -1) || (mode != 'blacklist' && mode != 'whitelist'))) {
    if (process.argv[2] != "-todate" || process.env.ARGS != "todate") { // bringing the empty redis db "to date" when the bot is started for the first time
      var regex = /([^.!?,:;()\s]*?)-ass ([^.!?,:;()\s]+)/i
      if (regex.test(comment.data.body)) {
        redisclient.exists(comment.data.name, function(err, exists) {
        if (err) {
          console.error(err)
        } else {
          if (exists == 0) {
            console.log(comment.data.body);
            var ftfy = comment.data.body.match(regex)[0].replace(regex, "\\\*$1 ass-$2")
            console.log(ftfy)
            if (process.argv[2] != "-declaw" || process.env.ARGS != "declaw") {
              reddit.comment(comment.data.name, ftfy + "\n\n\n\n*****\nI am a bot in beta for a period of five days. If I screw up really, really majorly, PM /u/okofish.", function(err, comment) {
                if (err) {
                  console.error(err)
                }
              })
            }

            redisclient.set(comment.data.name, "read")
          }
        }
      })

      }
    }


  }
}

comment_stream.on('new', function(comments) {
  comments.forEach(processComment)
});
