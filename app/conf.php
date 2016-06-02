<?php
require_once "autoload.php";
$dao = B7KP\Core\Dao::getConn();
$factory = new B7KP\Model\Model($dao);
session_start();
?>