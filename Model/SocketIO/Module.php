<?php
class SocketIO_Model_SocketIO_Module extends Core_Model_Default
{

    public function __construct($params = array())
    {
        parent::__construct($params);
        $this->_db_table = 'SocketIO_Model_Db_Table_SocketIO_Module';
        return $this;
    }

    /*
     * Add a socket.io module to execute
     *
     * @params string $name Name of the module (could be anything)
     * @params string $path Path of the JS file of the module (e.g. : MyModule/resources/socketio/mymodule.js)
     * @returns SocketIO_Model_SocketIO_Module added model
     */
    public static function installSocket($name, $path) {
        $module = new self();
        return $module->setData(array(
            "name" => $name,
            "path" => $path
        ))->insertOrUpdate(array("path"));
    }

    /**
     * @param Siberian_Cron $cron
     * @param Cron_Model_Cron $task
     */
    public static function serve($cron, $task) {
        $is_running = self::testService(35500);
        if(!$is_running) {
            $cron->log("Node server is not running, starting.");

            $base_path = Core_Model_Directory::getBasePathTo("");
            $base_node = Core_Model_Directory::getBasePathTo("app/local/modules/SocketIO/node_app");
            $bin_path = System_Model_Config::getValueFor("node_binary_path");

            if(!$bin_path) {
                $cron->log("Node is not installed.");
                return;
            }

            $command =  sprintf("%s %s/server.js %s", $bin_path, $base_node, $base_path);

            try {
                exec($command, $output, $return);
            } catch(Exception $e) {
                $cron->log("Node server exception.");
            }

        } else {
            $cron->log("Node server is running, continue.");
        }

    }

    /**
     * @return bool
     */
    public static function testService($port = 35500) {
        $host = "127.0.0.1";

        $connection = @fsockopen($host, $port, $errno, $errstr, 2);
        if (is_resource($connection)) {
            fclose($connection);
            return true;
        } else {
            return false;
        }
    }

    /**
     * @return bool
     */
    public static function serviceStatus() {
        return self::testService(35500);
    }

}