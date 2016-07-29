<?php
class SocketIO_Bootstrap {

    public static function init($bootstrap) {
        # Registering node service
        Siberian_Service::registerService("Node server", array(
            "command" => "SocketIO_Model_SocketIO_Module::serviceStatus",
            "text" => "Running",
        ));
    }
}