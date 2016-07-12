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
        }

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
            self.init();
            if(_.isObject(_connection) && _.isFunction(_connection[method])) {
                _connection[method].apply(_connection, arguments);
            }
        }
    });

    return self;
};

module.exports = function (siberian) { return new Siberian_Application_Db(siberian); };