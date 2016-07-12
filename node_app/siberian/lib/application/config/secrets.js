function Siberian_Application_Config_Secrets(siberian) {
    if(siberian.constructor.name !== "Siberian")
        throw new Error("Please use a Siberian object to instantiate this class.");

    var fs  = require("fs");
    var path = require('path');
    var _  = require("lodash");

    var json_path = function() {
        return path.resolve(siberian.base, "./app/configs/secrets.json");
    };

    var self = this;  // siberian.application.config.secrets

    /**
     * Generate secret for a given name
     *
     * @return mixed string secret token or NULL if secret already exists
     */
    self.generate = function(name) {
        return _addSecret(name, __getToken());
    };

    /**
     * Generate secret for a given name only if it doesn't exist
     *
     * @return string secret token
     */
    self.generateOnce = function(name) {
        var secret = self.get(name);

        if(secret === null) {
            return self.generate(name);
        }

        return secret;
    };


    /**
     * Get secret for a given name
     *
     * @return mixed string secret token or NULL if it doesn't exist
     */
    self.get = function(name) {
        var secrets = _readSecrets();
        var secret = _.get(secrets, name);

        if(_.isString(secret) && _.trim(secret).length > 0) {
            return secret;
        }

        return null;
    };

    /**
     * Destroy secret for a given name if it exist
     *
     * @return string secret token
     */
    self.destroy = function(name) {
        self._removeSecret(name);
    };

    /**
     * Destroy and regenerate secret for a given name if it exist
     *
     * @return string secret token
     */
    self.regenerate = function(name) {
        self.destroy(name);
        return self.generate(name);
    };


    var _createSecretsFileIfNeeded = function()
    {
        var exists = false;
        try {
            exists = fs.statSync(json_path()).isFile();
        } catch (e) {
            if(_.get(e, "code") !== "ENOENT")
                throw e;
        }

        if (!exists) {
            fs.writeFileSync(json_path(), '{}', {encoding: 'utf-8'});
        }

        return json_path();
    }

    var _addSecret = function(name, secret) {
        var secrets = _readSecrets();
        if(!_.has(secrets, name)) {
            secrets[name] = secret;
            _writeSecrets(secrets);
            return secret;
        }

        return null;
    };

    var _removeSecret = function(name) {
        var secrets = _readSecrets();
        if(_.has(secrets, name)) {
            secrets[name] = undefined;
            delete secrets[name];
        }
        _writeSecrets(secrets);
    };

    var _readSecrets = function()
    {
        var secrets_json = _createSecretsFileIfNeeded();
        data = fs.readFileSync(json_path(), {encoding: "utf-8"});
        decoded = {};
        try {
            decoded = JSON.parse(data);
        } catch(e) {
        }

        return _.isObject(decoded) ? decoded : {};
    };

    var _writeSecrets = function(listOfSecrets)
    {
        if(_.isObject(listOfSecrets)) {
            secrets_json = _createSecretsFileIfNeeded();
            fs.writeFileSync(secrets_json, JSON.stringify(listOfSecrets), {encoding: 'utf-8'});
        }
    };

    var __getToken = function(length){
        if(!_.isNumber(length))
            length = 32;

        token = "";
        codeAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                        + "abcdefghijklmnopqrstuvwxyz"
                        + "0123456789";
        for(var i=0;i<length;i++){
            token = token + codeAlphabet[Math.floor(Math.random()*codeAlphabet.length)];
        }
        return token;
    };


    return self;
}

module.exports = function(siberian) { return new Siberian_Application_Config_Secrets(siberian); };