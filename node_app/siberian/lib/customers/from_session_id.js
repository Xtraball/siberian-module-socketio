function Siberian_Customers_From_SessionID(siberian) {
    if(siberian.constructor.name !== "Siberian")
        throw new Error("Please use a Siberian object to instantiate this class.");

    var _ = require("lodash");
    var PHPUnserialize = require('php-unserialize');
    var Q = require("Q");

    return (function(sessionID, appID) {
        if(!appID || !_.isNumber(+appID) || (+appID) < 1)
            appID = null;

        var deferred = Q.defer();
        var db = siberian.application.db;

        db.query("SELECT data FROM session WHERE session_id=?;", [sessionID], function(err, results) {
            if(err)
                deferred.reject(err);

            if(results.length > 0) {
                var result = results[0];

                if(_.has(result, "data")) {
                    var data = PHPUnserialize.unserializeSession(result.data);
                    var customer_id = null;

                    if(_.get(data, ("mobile"+appID+".current_type")) === "customer") {
                        customer_id = +_.get(data, "mobile" + appID + ".object_id");
                    }

                    if(customer_id === null && _.get(data, ("mobile.current_type")) === "customer") {
                        customer_id = +_.get(data, "mobile.object_id");
                    }

                    if(_.isNumber(customer_id) && customer_id > 0) {
                        db.query("SELECT * FROM customer WHERE customer_id=?;", [customer_id], function(err, results) {
                            if(err)
                                return deferred.reject(err);


                            if(results.length > 0) {
                                return deferred.resolve(results[0]);
                            }

                            return deferred.reject(null);
                        });
                        return;
                    }
                }
            }
            return deferred.reject(null);
        });

        return deferred.promise;
    });
};

// Here we're just exporting a single function
module.exports = Siberian_Customers_From_SessionID; // siberian.customers.fromSessionID