function Siberian_Customers_With_Metadata(siberian) {
    if(siberian.constructor.name !== "Siberian")
        throw new Error("Please use a Siberian object to instantiate this class.");

    var _ = require("lodash");
    var PHPUnserialize = require('php-unserialize');
    var Q = require("q");

    var self = this; // siberian.customers.withMetadata;

    var getAndAddMetadatas = function(user) {
        if(_.isObject(user) && _.isNumber(user.customer_id)) {
            var q = Q.defer();
            var _metadatas = {};

            siberian.application.db.query(
                "SELECT * from customer_metadata WHERE customer_id = ?",
                [user.customer_id],
                function(err, results) {
                    if(err)
                        return q.reject(err);

                    for(var i=0; i<results.length; i++) {
                        try {
                            _metadatas[results[i].code] = PHPUnserialize.unserialize(results[i].datas);
                        } catch(e) {
                            console && console.warn && console.warn("Failed to unserialize some metadata : ", _.get(results, "["+i+"].code"), _.get(results, "["+i+"].datas"), e);
                        }
                    }

                    user.metadatas = function(code, key) {
                        return _.get(_metadatas, code+(key ? "."+key : ""));
                    };

                    return q.resolve(user);
                }
            );

            return q.promise;
        }

        return Q.resolve(user);
    };

    self.fromID = function() { // siberian.customers.withMetadatas.fromID
        return siberian.customers.fromID.apply(siberian.customers, arguments).then(getAndAddMetadatas);
    };

    self.fromSessionID = function() { // siberian.customers.withMetadatas.fromSessionID
        return siberian.customers.fromSessionID.apply(siberian.customers, arguments).then(getAndAddMetadatas);
    };

    return self;
};

module.exports = function(siberian) { return new Siberian_Customers_With_Metadata(siberian); }; // siberian.customers.withMetadatas
