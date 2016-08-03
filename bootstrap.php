<?php
class SocketIO_Bootstrap {

    public static function init($bootstrap) {
        # Registering node service
        Siberian_Service::registerService("Node server", array(
            "command" => "SocketIO_Model_SocketIO_Module::serviceStatus",
            "text" => "Running",
        ));

        $base_var_apps = Core_Model_Directory::getBasePathTo("/var/apps/");

        $PLATFORMS = array("browser", "ionic/android/assets/www", "ionic/ios/www", "ionic/ios-noads/www");

        foreach ($PLATFORMS as $platform) {
            $index_file = "{$base_var_apps}/{$platform}/index.html";
            $base_index = file_get_contents($index_file);

            if(strpos($base_index, "modules/socketio/libraries/socket.io.min.js") === false) {
                $search = "</head>";
                $replace = "    <script src='modules/socketio/libraries/socket.io.min.js'></script>
            </head>";

                $base_index = str_replace($search, $replace, $base_index);
                file_put_contents($index_file, $base_index);
            }
        }
    }
}
