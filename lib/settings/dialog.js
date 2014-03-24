
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

SettingsDialog.prototype.saveSettings = function(){
  settings.connections = this.getConnectionSettings();
  settings.save();
};

SettingsDialog.prototype.addConnection = function(){
  settings.connections = this.getConnectionSettings();
  settings.connections.push({});

  // Force render
  this.hide();
  this.show();
};

SettingsDialog.prototype.addChannel = function(connection){
  connection.channels = connection.channels || [];
  connection.channels.push('');

  // Force render
  this.hide();
  this.show();
};

/**
 * Render the settings template.
 *
 * @api public
 */

SettingsDialog.prototype.render = function(){
  var connections = settings.connections || [];
  renderedConnections = connections.map(function(connectionData, index){

    var channels = connectionData.channels || [];
    renderedChannels = channels.map(function(channel){
      return channelView({ channelName: channel });
    });

    return connectionView({
      id: index,
      host: connectionData.host || '',
      port: connectionData.port || '',
      realname: connectionData.realname || '',
      nickname: connectionData.nickname || '',
      password: connectionData.password || '',
      channels: renderedChannels.join('\n'),
    });
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
