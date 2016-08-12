function Siberian_Application_Db(siberian) {
    if(siberian.constructor.name !== "Siberian")
        throw new Error("Please use a Siberian object to instantiate this class.");

    var _ = require("lodash");
    var mysql = require("mysql");

    var _connection = null;

    var self = this; // siberian.application.db

    self.reset = function() {
        if(_.isObject(_connection) && _.isFunction(_connection.destroy))
            _connection.destroy();

        _connection = null;
        return self.init();
    };

    var firstConnection = true;

    self.init = function() {
        if(_connection == null) {
            var params = siberian.application.config.app.ini.production.resources.db.params;
            _connection = mysql.createConnection({
                host: params.host,
                user: params.username,
                password: params.password,
                database: params.dbname,
                charset: params.charset
            });

            _connection.on('error', function(err) {
                console.log('db error', err);
                if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
                  firstConnection = true;
                  self.init();                         // lost due to either server restart, or a
                } else {                                      // connnection idle timeout (the wait_timeout
                  throw err;                                  // server variable configures this)
                }
            });
        }

        _connection.connect(function(err) {              // The server is either down
            if(err) {                                     // or restarting (takes a while sometimes).
              console.log('error when connecting to db:', err);
              firstConnection = true;
              setTimeout(self.init, 2000); // We introduce a delay before attempting to reconnect,
            }                                     // to avoid a hot loop, and to allow our node script to
        });                                     // process asynchronous requests in the meantime.

        return self;
    };

    _.each([
        "connect",
        "query",
        "end",
        "destroy",
        "changeUser",
        "beginTransaction",
        "commit",
        "rollback",
        "statistics",
        "pause",
        "resume",
        "escape",
        "espaceId",
        "format"
    ], function(method) {
        self[method] = function() {
            var args = arguments;
            if(!firstConnection && _.isObject(_connection) && _.isFunction(_connection[method])) {
                _connection[method].apply(_connection, args);
            } else {
                self.init();
                if(_.isObject(_connection)) {
                    _connection.query("SET sql_mode = '';", function(err) {
                        if(err)
                            throw err;
                        var params = siberian.application.config.app.ini.production.resources.db.params;
                        if(!_.isString(params.charset) || params.charset.length < 1) {
                            _connection.query(
                                "SELECT @@character_set_database AS charset;",
                                function(err, result) {
                                    if(err)
                                        throw err;

                                    if(_.isArray(result) && _.isObject(result[0]) && _.isString(result[0].charset) && result[0].charset.length > 0) {
                                        _connection.changeUser({charset : result[0].charset}, function(err) {
                                            firstConnection = false;
                                            _connection[method].apply(_connection, args);
                                        });
                                    } else {
                                        // Tant pis
                                        console.warn("Unable to find DB charset");
                                        _connection[method].apply(_connection, args);
                                    }
                                }
                            );
                        } else {
                            _connection[method].apply(_connection, args);
                        }
                    });
                }
            }
        }
    });

    return self;
};

module.exports = function (siberian) { return new Siberian_Application_Db(siberian); };
