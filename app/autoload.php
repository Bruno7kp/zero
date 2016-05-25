<?php 
// Autoload
function __autoload($className) 
{ 
	if(!defined("MAIN_DIR"))
	{
		define("MAIN_DIR", dirname(dirname(__FILE__))."/");
	}

	if(strpos($className, "\\") !== false)
	{
		if(file_exists("src/Api/".str_replace('\\', '/', $className . '.php'))) {
			require_once "src/Api/".str_replace('\\', '/', $className . '.php');
		}elseif(file_exists("src/".str_replace('\\', '/', $className . '.php'))) {
			require_once "src/".str_replace('\\', '/', $className . '.php');
		}
	}
	else
	{
		$dirs = array(
			"src/Controller/", 
			"src/Core/", 
			"src/Entity/",
			"src/Factory/", 
			"src/Form/", 
			"src/Interfaces/",
			"src/Library/",
			"src/Security/"
		);

		foreach ($dirs as $value) {
			$file = MAIN_DIR . $value . $className . ".php";

			if(file_exists($file))
			{
				require_once $file;
				break;
			}
		}
	}
} 
?>