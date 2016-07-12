function Siberian_Application_Config_App(siberian) {
    if(siberian.constructor.name !== "Siberian")
        throw new Error("Please use a Siberian object to instantiate this class.");

    var self = this;  // siberian.application.config.app

    var fs  = require("fs");
    var path = require('path');
    var _  = require("lodash");
    var ini  = require("ini");

    var _loaded = false;
    var _data = {};

    function _parseParsedData(data) {
        var final = {};

        _.each(data, function(value, key) {
            _.set(
                final,
                key,
                (_.isArray(value) || _.isObject(value)) ? _parseParsedData(value) : value
            )
        });

        return Object.freeze(final);
    };

    function _load_ini() {
        var ini_path = path.resolve(siberian.base, "./app/configs/app.ini");
        var data =  ini.parse(fs.readFileSync(ini_path, 'utf-8'));
        return _parseParsedData(data);
    };

    Object.defineProperty(self, "ini", {
        get: function() {
            if(_loaded === false)
                _data = _load_ini();

            return _data;
        }
    });

    self.reload = function() {
        _loaded = false;
        return self.ini;
    };


    return self;
}

module.exports = function(siberian) { return new Siberian_Application_Config_App(siberian); };