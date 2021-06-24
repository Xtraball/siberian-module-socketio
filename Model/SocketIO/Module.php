<?php

/**
 * Class SocketIO_Model_SocketIO_Module
 */
class SocketIO_Model_SocketIO_Module extends Core_Model_Default
{
    /**
     * @var string
     */
    public static $basePath;

    /**
     * @var string
     */
    public static $logPath;

    /**
     * @var string
     */
    public static $baseNode;

    /**
     * @var string
     */
    public static $binPath;

    /**
     * @var string
     */
    protected $_db_table = SocketIO_Model_Db_Table_SocketIO_Module::class;

    /**
     *
     */
    public static function setVars()
    {
        self::$basePath = path('/');
        self::$logPath = path('/var/log/module_socketio.log');
        self::$baseNode = path('/app/local/modules/SocketIO/node_app');
        self::$binPath = path('/app/local/modules/SocketIO/resources/bin/node_64');
    }

    /**
     * Add a socket.io module to execute
     *
     * @param string $name Name of the module (could be anything)
     * @param string $path Path of the JS file of the module (e.g. : MyModule/resources/socketio/mymodule.js)
     * @return SocketIO_Model_SocketIO_Module added model
     */
    public static function installSocket($name, $path)
    {
        $module = new self();
        return $module->setData([
            "name" => $name,
            "path" => $path
        ])->insertOrUpdate(["path"]);
    }


    /**
     * @param Siberian_Cron $cron
     * @param Cron_Model_Cron $task
     * @throws Exception
     */
    public static function serve($cron, $task)
    {
        self::setVars();

        $command = sprintf("%s %s/server.js %s >> %s 2>&1", self::$binPath, self::$baseNode, self::$basePath, self::$logPath);

        try {
            $cron->log($command);
            exec($command, $output, $return);
        } catch (\Exception $e) {
            $cron->log('Node server exception.');
        }

        if ($log = @file_get_contents(self::$logPath)) {
            $pos = strrpos($log, "---STARTING---");
            if ($pos >= 0) {
                $log = substr($log, $pos);

                preg_match("/^\[Error\:(.*)\]$/m", $log, $matches);

                if (count($matches) > 0) {
                    throw new \Exception(trim($matches[1]));
                }
            }
        }
    }

    /**
     * @return bool
     */
    public static function serviceStatus()
    {
        self::setVars();

        $command = sprintf("%s %s/server.js %s --status", self::$binPath, self::$baseNode, self::$basePath);
        $output = null;
        exec($command, $output, $return);
        return trim($output[0]) === 'running';
    }

    /**
     * @return bool
     */
    public static function killServer()
    {
        self::setVars();

        $command = sprintf("%s %s/server.js %s --kill >> %s 2>&1", self::$binPath, self::$baseNode, self::$basePath, self::$logPath);
        $output = null;
        exec($command, $output, $return);
        return trim($output[0]) === "killed";
    }

    /**
     * @return int|null
     */
    public static function getSocketIOPort()
    {
        $port = __get('socket_io_port');
        if (is_numeric($port)) {
            $port = (int) $port;
            if ($port > 0) {
                return $port;
            }
        }

        return null;
    }
}
