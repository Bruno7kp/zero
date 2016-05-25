<?php 
namespace B7KP\Utils;

class Cache
{
	
	private function __construct(){}

	static function getJsonData($class, $file = "main")
	{
		$class = str_replace("\\", "-", $class);
		$filejson = MAIN_DIR."/cache/".$class."/".$file.".json";
		$content = file_get_contents($filejson);
		return json_decode($content);
	}

	static function setJsonData($class, $data, $file = "main")
	{
		$dir = MAIN_DIR."/cache/".$class;
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