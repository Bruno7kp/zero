<?php 
// Autoload
function zero_autoloader($className) 
{ 
	if(!defined("MAIN_DIR"))
	{
		define("MAIN_DIR", dirname(dirname(__FILE__))."/");
	}

	$class = str_replace('\\', '/', $className);
	$file = MAIN_DIR."src/".$class.".php";
	if(file_exists($file))
	{
		require_once $file;
	}
}
spl_autoload_register("zero_autoloader");
