q = require 'q'
rawjs = require 'raw.js'
events = require 'events'
reddit = new rawjs()

# these hold the setTimeout IDs for the getItems loop
get_items_timeout_id = null
get_items_backtrack_timeout_id = null

LIMIT = 100 # number of items to retrieve per request
MAX_ATTEMPTS = 5 # number of attempts to try an API call before giving up
POLL_INTERVAL = 5000 # milliseconds between API calls
BACKTRACK_POLL_INTERVAL = 2000 # milliseconds between backtrack API calls

module.exports =

class RedditStream extends events.EventEmitter
  
  is_running: no
  
  constructor: (@type, @subreddit = 'all', user_agent = 'reddit-stream bot', auth = null) ->
    unless @type is 'posts' or @type is 'comments'
      throw new Error('type must be "posts" or "comments"')
    reddit._userAgent = user_agent
    @login auth if auth?
  
  login: (auth) ->
    
    unless auth.app?.id? and auth.app?.secret? and auth.username? and auth.password?
      throw new Error('auth object must have app.id, app.secret, username, and password')
    
    deferred = q.defer()
    
    reddit.setupOAuth2 auth.app.id, auth.app.secret
    reddit.auth { username: auth.username, password: auth.password }, (error, response) =>
      if error?
        deferred.reject error
        @emit 'login.error', error
      else
        deferred.resolve response
        @emit 'login.success', response
    
    deferred.promise
  
  start: ->
    @is_running = yes
    @getItems()
    @emit 'start'
  
  stop: ->
    @is_running = no
    clearTimeout get_items_timeout_id
    clearTimeout get_items_backtrack_timeout_id
    @emit 'stop'
  
  getItems: (newest = '', last_newest = '', after = '', attempt = 1, is_backtracking = no) =>
    
    return unless @is_running
    
    options =
      r: @subreddit
      limit: LIMIT
      after: after if after isnt ''
    
    callback = (error, response) =>
      
      return unless @is_running
      
      if @type is 'posts'
        items = response?.children
      else if @type is 'comments'
        items = response?.data?.children
      
      if error? or not items?
        if error?
          @emit 'error',
            message: 'could not get items (error)'
            response: response
            error: error
        else
          @emit 'error',
            message: 'could not get items (empty response):'
            response: response
            error: error
        if ++attempt <= MAX_ATTEMPTS
          get_items_timeout_id = setTimeout (=> @getItems newest, last_newest, after, attempt, is_backtracking), POLL_INTERVAL
        else unless is_backtracking
          get_items_timeout_id = setTimeout @getItems, POLL_INTERVAL
      else
        
        new_items = []
        
        if items.length > 0
          
          for item in items
            if is_backtracking
              break if item.data.name <= last_newest
            else
              break if item.data.name <= newest
            new_items.push item
          
          if items[0].data.name > newest and not is_backtracking
            last_newest = newest
            newest = items[0].data.name
          
          after = items[items.length - 1].data.name
        
        if new_items.length > 0
          @emit 'new', new_items
        
        should_backtrack = new_items.length is items.length
        
        if last_newest is '' or (0 <= items.length < LIMIT)
          should_backtrack = no
        
        if is_backtracking
          if should_backtrack
            get_items_backtrack_timeout_id = setTimeout (=> @getItems newest, last_newest, after, 1, yes), BACKTRACK_POLL_INTERVAL
        else
          if should_backtrack
            get_items_backtrack_timeout_id = setTimeout (=> @getItems newest, last_newest, after, 1, yes), 0
          get_items_timeout_id = setTimeout (=> @getItems newest, last_newest), POLL_INTERVAL
    
    if @type is 'posts'
      reddit.new options, callback
    else if @type is 'comments'
      reddit.comments options, callback
