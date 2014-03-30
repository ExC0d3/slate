
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
SettingsDialog.prototype.getConnectionSettings = function( form ){

  var connectionData = {},
      name,
      value;

  form.find('input').each(function(inputEl){
    var name = inputEl.attr('name');
    var value = inputEl.prop('value').trim();
    if(value.length){
      if(name.indexOf('[]') === name.length - 2) {
        name = name.replace('[]', '');
        if(!connectionData[name]){
          connectionData[name] = [];
        }
        connectionData[name].push(value);
      } else {
        connectionData[name] = value;
      }
    }

  });
  // return false if host is empty = dont save it
  return connectionData.host ? connectionData : false;
};

/**
 * Save the settings from the dom.
 *
 * @api private
 */
SettingsDialog.prototype.saveSettings = function( e ){
  var form = e,
      $form,
      index,
      connection;
  // if form submission
  if( e.preventDefault ){
    e.preventDefault();
    form = e.target;
  }
  $form = dom(form);
  // find the index of the form
  index = Array.prototype.indexOf.call(this.el.find( 'form' ).els, form);
  connection = this.getConnectionSettings( $form );
  if( connection ){
    // update/store the connection
    settings.connections[index] = connection;
    // save it
    settings.save();
  }
};

/**
 * Add a blank connection to the dialog
 *
 * @api private
 */
SettingsDialog.prototype.addConnection = function(){
  var newConnection = {channels:[""]};
  var newConnectionId = settings.connections.length;
  var newConnectionEl = this.renderConnection(newConnection, newConnectionId);

  // Add the new connection to the dom
  this.el.find('#connections').append(newConnectionEl);
  // open the new connection panel
  this.el.find('#connections li:last-child h2').els[0].click();

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
  var domChannels = this.el.find('#connections .channels ul');
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
};

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
};

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

  el.on('submit', 'form', this.saveSettings.bind(this));
  el.on('reset', 'form', this.removeConnection.bind(this));

  el.on('click', '.add-channel', function(e){
    e.preventDefault();
    var id = e.target.id;
    var index = id.replace('add-channel-', '');

    this.saveSettings(dom( e.target.form ));
    self.addChannel(settings.connections[index]);
  }.bind(this));

  el.on('click', '#connections h2', self.focusConnection.bind(this));

  el.on('keyup', '#connections [name=host]', self.updateConnectionName.bind(this));

  dom('body')
  .addClass('showing-dialog')
  .append(el);

  // open the first connection
  var connection = el.find('#connections li h2').els;
  if( connection.length ){
    connection[0].click();
  }
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

/**
 * Focus the connection
 *
 * @api private
 */
SettingsDialog.prototype.focusConnection = function( e ){
  // get the parent container
  var el = e.target.parentNode,
  // get the siblings
      focusedSibling = el.parentNode.querySelector( 'ul>li.focused' );

  // remove the class of the previous element if found
  if( focusedSibling ){
    focusedSibling.classList.remove( 'focused' );
    // save the connection when closing it
    this.saveSettings( focusedSibling.querySelector('form') );
  }
  // add the class to the element
  el.classList.add( 'focused' );

  // focus the first field
  el.querySelector('form input').focus();

};

/**
 * Update the title of the connection on the fly
 *
 * @api private
 */
SettingsDialog.prototype.updateConnectionName = function( e ){
  dom(e.target).parent('li').find('h2').text( e.target.value );
};

/**
 * remove a connection from the settings
 *
 * @api private
 */
SettingsDialog.prototype.removeConnection = function( e ){

  e.preventDefault();

  var el = e.target,
      li = el.parentNode.parentNode,
      next = li.nextElementSibling,
      previous = li.previousElementSibling;

  li.parentNode.removeChild( li );

  // focus to the next or previous connection pane
  if( next ){
    next.querySelector('h2').click();
  }
  else if(previous){
    previous.querySelector('h2').click();
  }
  // update settings.connections by saving all remaining connections
  this.saveAllConnections();
};

/**
 * save all active connections
 *
 * @api private
 */
SettingsDialog.prototype.saveAllConnections = function(){
  var connections = [];
  this.el.find( 'form' ).each(function( form ){
    connections.push( this.getConnectionSettings( form ) );
  }.bind(this));
  // update
   settings.connections = connections.slice();
  // // save it
  settings.save();
};