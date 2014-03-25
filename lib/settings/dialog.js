
/**
 * Module dependencies.
 */

var minstache = node('minstache');
var dom = require('dom');
var settings = require('./index.js');

// templates
var dialog = require('./dialog.html');
var connectionView = require('./connection.html');
var channelView = require('./channel.html');

// compile

dialog = minstache.compile(dialog);
connectionView = minstache.compile(connectionView);
channelView = minstache.compile(channelView);

/**
 * Expose `SettingsDialog` singleton.
 */

module.exports = new SettingsDialog;

/**
 * Initialize a new settings dialog manager.
 *
 * @api public
 */

function SettingsDialog() {}

/**
 * Get the settings from the dom.
 *
 * @api private
 */
SettingsDialog.prototype.getConnectionSettings = function(){
  // TODO: tidy up
  var el = this.el;
  var connections = el.find('#connections > li');
  return connections.map(function(connectionEl){
    var connectionData = {};
    connectionEl.find('input').each(function(inputEl){
      var name = inputEl.attr('name');
      var value = inputEl.prop('value');
      if(value){
        if(name.indexOf('[]') === name.length - 2) {
          name = name.replace('[]', '');
          if(!connectionData[name]){
            connectionData[name] = [];
          }
          connectionData[name].push(value);
        } else {
          connectionData[name] = value
        }
      }

    });
    return connectionData;
  });
};

/**
 * Save the settings from the dom.
 *
 * @api private
 */
SettingsDialog.prototype.saveSettings = function(){
  settings.connections = this.getConnectionSettings();
  settings.save();
};

/**
 * Add a blank connection to the dialog
 *
 * @api private
 */
SettingsDialog.prototype.addConnection = function(){
  var newConnection = {};
  var newConnectionId = settings.connections.length;
  var newConnectionEl = this.renderConnection(newConnection, newConnectionId);

  // Add the new connection to the dom
  this.el.find('#connections').append(newConnectionEl);

  // Add to the settings
  settings.connections.push(newConnection);
};

/**
 * Add a channel to the settings dialog for a connection
 *
 * @api private
 */
SettingsDialog.prototype.addChannel = function(connection){
  connection.channels = connection.channels || [];
  var connectionId = settings.connections.indexOf(connection);
  var domChannels = this.el.find('#connections .channels');
  var domConnectionChannels = domChannels.els[connectionId];

  domConnectionChannels.innerHTML += this.renderChannel('');
};

/**
 * Convert channel model into html
 *
 * @api private
 */
SettingsDialog.prototype.renderChannel = function(channelName){
  return channelView({ channelName: channelName });
}

/**
 * Convert connection model into html
 *
 * @api private
 */
SettingsDialog.prototype.renderConnection = function(connection, id) {
  connection = connection || {};
  var renderedChannels = this.renderChannels(connection.channels);

  return connectionView({
    id: id,
    host: connection.host || '',
    port: connection.port || '6667',
    realname: connection.realname || '',
    nickname: connection.nickname || '',
    password: connection.password || '',
    channels: renderedChannels.join('\n'),
  });
}

/**
 * Convert an array of channels into html
 *
 * @api private
 */
SettingsDialog.prototype.renderChannels = function(channels){
  var self = this;
  channels = channels || [];
  return channels.map(function(channel){
    return self.renderChannel(channel);
  });
}

/**
 * Render the settings template.
 *
 * @api public
 */

SettingsDialog.prototype.render = function(){
  var self = this;

  var connections = settings.connections || [];
  renderedConnections = connections.map(function(connectionData, index){
    return self.renderConnection(connectionData, index);
  });

  var html = dialog({ connections: renderedConnections.join('\n') });
  return dom(html);
};

/**
 * Toggle display of the dialog.
 *
 * @api public
 */

SettingsDialog.prototype.toggle = function(){
  if (this.showing) this.hide()
  else this.show();
};

/**
 * Show the dialog.
 *
 * @api public
 */

SettingsDialog.prototype.show = function(){
  if (this.showing) return;
  var el = this.el = this.render();
  var self = this;

  this.showing = true;

  el.on('click', '#dialog-close', function(e){
    e.preventDefault();
    self.hide();
  });

  el.on('click', '#add-connection', function(e){
    e.preventDefault();
    self.addConnection();
  });
  el.on('click', '#save-connections', function(e){
    e.preventDefault();
    self.saveSettings();
  });

  el.on('click', '.add-channel', function(e){
    e.preventDefault();
    var id = e.target.id;
    var index = id.replace('add-channel-', '');

    settings.connections = self.getConnectionSettings();
    self.addChannel(settings.connections[index]);
  });

  dom('body')
  .addClass('showing-dialog')
  .append(el)
};

/**
 * Hide the dialog.
 *
 * @api public
 */

SettingsDialog.prototype.hide = function(){
  this.showing = false;
  dom('body').removeClass('showing-dialog');
  this.el.remove();
};
