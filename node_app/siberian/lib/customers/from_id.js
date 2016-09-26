function Siberian_Customers_From_ID(siberian) {
    if(siberian.constructor.name !== "Siberian")
        throw new Error("Please use a Siberian object to instantiate this class.");

    var _ = require("lodash");
    var Q = require("q");

    return (function(customerID) {
        var deferred = Q.defer();
        var db = siberian.application.db;

        if(_.isNumber(customerID) && customerID > 0) {
            db.query("SELECT * FROM customer WHERE customer_id=?;", [customerID], function(err, results) {
                if(err)
                    return deferred.reject(err);

                if(results.length > 0) {
                    return deferred.resolve(results[0]);
                }

                return deferred.reject(null);
            });
            return deferred.promise;
        }

        deferred.reject(null);
        return deferred.promise;
    });
};

// Here we're just exporting a single function
module.exports = Siberian_Customers_From_ID; // siberian.customers.fromID
