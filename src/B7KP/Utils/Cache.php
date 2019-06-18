<?php 
namespace B7KP\Utils;

class Cache
{
	
	private function __construct(){}

	static function getJsonData($class, $file = "main")
	{
		$filejson = MAIN_DIR."cache/".md5($class)."/".$file.".json";
		if(file_exists($filejson))
		{
			$content = file_get_contents($filejson);
			return json_decode($content);
		}
	}

	static function setJsonData($class, $data, $file = "main")
	{
		$dir = MAIN_DIR."cache/".md5($class);
		if(!file_exists($dir))
		{
			mkdir($dir, 0777, true);
		}
		$filejson = $dir."/".$file.".json";
		
		$fp = fopen($filejson, 'w');
		fwrite($fp, json_encode($data));
		fclose($fp);
		
	}
}
?>