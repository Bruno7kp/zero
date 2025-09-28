<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Ultra-early request logging (debug) – can be removed after stabilization
try {
    $rawUri = $_SERVER['REQUEST_URI'] ?? 'unknown';
    $rawMethod = $_SERVER['REQUEST_METHOD'] ?? 'CLI';
    $cl = $_SERVER['CONTENT_LENGTH'] ?? '';
    error_log('[EARLY_HTTP] method=' . $rawMethod . ' uri=' . $rawUri . ' content_length=' . $cl);
} catch (Throwable $e) {
    // ignore
}

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
