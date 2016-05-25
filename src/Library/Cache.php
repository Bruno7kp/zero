<?php 
/**
* src/Library/Cache.php
*/
class Cache
{
	
	private function __construct(){}

	static function getJsonData($class, $file = "main")
	{
		$filejson = dirname(dirname(dirname(__FILE__)))."/cache/".$class."/".$file.".json";
		$content = file_get_contents($filejson);
		return json_decode($content);
	}

	static function setJsonData($class, $data, $file = "main")
	{
		$dir = dirname(dirname(dirname(__FILE__)))."/cache/".$class;
		if(!file_exists($dir))
		{
			mkdir($dir, 0777, true);
		}
		$filejson = $dir."/".$file.".json";
		if(file_exists($filejson))
		{
			$fp = fopen($filejson, 'w');
			fwrite($fp, json_encode($data));
			fclose($fp);
		}
	}
}
?>