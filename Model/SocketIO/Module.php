<?php
class SocketIO_Model_SocketIO_Module extends Core_Model_Default
{

    public function __construct($params = array())
    {
        parent::__construct($params);
        $this->_db_table = 'SocketIO_Model_Db_Table_SocketIO_Module';
        return $this;
    }

    /**
     * Add a socket.io module to execute
     *
     * @param string $name Name of the module (could be anything)
     * @param string $path Path of the JS file of the module (e.g. : MyModule/resources/socketio/mymodule.js)
     * @return SocketIO_Model_SocketIO_Module added model
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
        $base_path = Core_Model_Directory::getBasePathTo("");
        $log_path = Core_Model_Directory::getBasePathTo("var/log/modules/socketio.log");
        if(!is_dir(dirname($log_path)) && !mkdir(dirname($log_path), 0777, true)) {
            $log_path = Core_Model_Directory::getBasePathTo("var/log/socketio.log");
        }
        $base_node = Core_Model_Directory::getBasePathTo("app/local/modules/SocketIO/node_app");
        $bin_path = System_Model_Config::getValueFor("node_binary_path");

        if(!$bin_path) {
            $cron->log("Node is not installed.");
            return;
        }

        $command =  sprintf("%s %s/server.js %s >> %s 2>&1", $bin_path, $base_node, $base_path, $log_path);

        try {
            exec($command, $output, $return);
        } catch(Exception $e) {
            $cron->log("Node server exception.");
        }

        if($log = @file_get_contents($log_path)) {
            $pos = strrpos($log, "---STARTING---");
            if($pos >= 0) {
                $log = substr($log, $pos);

                preg_match("/^\[Error\:(.*)\]$/m", $log, $matches);

                if(count($matches) > 0) {
                    throw new Exception("SocketIO: ".trim($matches[1]));
                }
            }
        }
    }

    /**
     * @return bool
     */
    public static function serviceStatus() {
        $base_path = Core_Model_Directory::getBasePathTo("");
        $base_node = Core_Model_Directory::getBasePathTo("app/local/modules/SocketIO/node_app");
        $bin_path = System_Model_Config::getValueFor("node_binary_path");

        if(!$bin_path) {
            return false;
        }

        $command =  sprintf("%s %s/server.js %s --status", $bin_path, $base_node, $base_path);
        $output = null;
        exec($command, $output, $return);
        return trim($output[0]) === "running";
    }

    public static function killServer() {
        $base_path = Core_Model_Directory::getBasePathTo("");
        $log_path = Core_Model_Directory::getBasePathTo("var/log/modules/socketio.log");
        if(!mkdir(basename($log_path), 0777, true)) {
            $log_path = Core_Model_Directory::getBasePathTo("var/log/socketio.log");
        }
        $base_node = Core_Model_Directory::getBasePathTo("app/local/modules/SocketIO/node_app");
        $bin_path = System_Model_Config::getValueFor("node_binary_path");

        if(!$bin_path) {
            return false;
        }

        $command =  sprintf("%s %s/server.js %s --kill >> %s 2>&1", $bin_path, $base_node, $base_path, $log_path);
        $output = null;
        exec($command, $output, $return);
        return trim($output[0]) === "killed";
    }

    public static function getSocketIOPort() {
        $config = new System_Model_Config();
        $config->find("socket_io_port", "code");
        $port = $config->getValue();

        if(is_numeric($port)) {
            $port = intval($port, 10);
            if($port > 0)
                return $port;
        }

        return null;
    }
}
