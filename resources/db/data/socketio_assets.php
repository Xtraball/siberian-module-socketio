<?php
# Register assets
$base = Core_Model_Directory::getBasePathTo("/app/local/modules/SocketIO/");
$base_var_apps = Core_Model_Directory::getBasePathTo("/var/apps/");

$PLATFORMS = array("browser", "ionic/android/assets/www", "ionic/ios/www", "ionic/ios-noads/www");

foreach ($PLATFORMS as $platform) {
    exec("cp -r {$base}/resources/var/apps/* {$base_var_apps}/{$platform}/");
    exec("chmod -R 775 {$base_var_apps}/{$platform}/");
}