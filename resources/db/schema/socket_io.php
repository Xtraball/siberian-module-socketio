<?php
/**
 *
 * Schema definition for 'socket_io'
 *
 * Last update: 2020-01-30
 *
 */
$schemas = $schemas ?? [];
$schemas['socket_io'] = [
    'module_id' => [
        'type' => 'int(11) unsigned',
        'auto_increment' => true,
        'primary' => true,
    ],
    'name' => [
        'type' => 'varchar(128)',
    ],
    'path' => [
        'type' => 'text',
    ],
    'created_at' => [
        'type' => 'datetime',
    ],
    'updated_at' => [
        'type' => 'datetime',
    ],
];