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

    }

    /**
     * @return bool
     */
    public static function serviceStatus() {
        $output = null;
        exec($command, $output, $return);
        return trim($output) === "running";
    }

    public static function getSocketIOPort() {
        $config = new System_Model_Config();
        $config->find("socket_io_port", "code");
        $port = $config->getValue();

        file_put_contents("/tmp/coucou.txt", $port);

        if(is_numeric($port)) {
            $port = intval($port, 10);
            file_put_contents("/tmp/coucou2.txt", $port);
            if($port > 0)
                return $port;
        }

        return null;
    }
}
