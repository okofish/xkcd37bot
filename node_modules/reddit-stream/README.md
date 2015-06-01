#reddit-stream

## About

reddit-stream is a NodeJS module that provides a constant stream of posts and comments from reddit. This module uses [raw.js](https://bitbucket.org/Doctor_McKay/raw.js) to retrieve data from reddit.

## Usage

Install via NPM.

```bash
$ npm install reddit-stream
```

Then simply require within your application, start the bot, and subscribe to the "new" event:

```coffee
RedditStream = require 'reddit-stream'

comment_stream = new RedditStream 'comments', 'all', 'unique user agent for my-supercool-bot'

# optionally log in
auth =
  username: 'my-supercool-bot'
  password: 'password'
  app:
    id: 'your-app-id'
    secret: 'your-app-secret'

comment_stream.login(auth).then(
  ->
    console.log 'logged in for comment stream'
    comment_stream.start()
  ->
    console.log 'failed to log in!'
)

# do stuff with new items here
comment_stream.on 'new', (comments) ->
  console.log 'found', comments.length, 'comment(s)'
```
If you wish to log in but do not have a reddit app created, visit [this page](https://ssl.reddit.com/prefs/apps/) and create a new "script" application to obtain an app id & secret. Put whatever you want in "redirect uri" as it will not be used.

## RedditStream Parameters

The RedditStream class's constructor accepts three parameters:

1. `type` - the type of item to stream from reddit; either "comments" or "posts"
2. `subreddit` - (optional) the subreddit to read items from; default is "all"
3. `user_agent` - (optional) reddit suggests supplying a unique user agent for all bots; default is "reddit-stream bot"
4. `auth` - (optional) an object containing login credentials (see example above). If you use this parameter instead of the login() method, listen to the `login.success` and `login.error` events to know when you should call the start() method

## License

> The MIT License (MIT)

> Copyright (c) 2014 Colin Wood

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:

> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
