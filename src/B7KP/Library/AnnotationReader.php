<?php 
namespace B7KP\Library;

class AnnotationReader implements iCache
{
	private $reflection;
	private $scan;
	private $usecache = false;
	private static $updated = 0;
	
	function __construct()
	{
		if($this->useCache())
		{
			$this->loadCache();
		}
	}

	/**
	* $cpm = class/property/method
	*/
	public function find($cpm, $annotation, $forceupdate = true)
	{
		if($this->useCache() == false)
		{
			$this->scan();
			$this->parseToObject();
			$forceupdate = false;
		}
		if($forceupdate)
		{
			self::$updated += 1;
			return $this->scan()->loadCache()->find($cpm, $annotation, false);
		}
		else
		{
			$return = array();
			if($cpm == "class")
			{
				foreach ($this->scan->$cpm as $class => $value) {
					if(isset($value->$annotation))
					{
						$return[$class] = $value->$annotation; 
					}
				}
			}
			else
			{
				foreach ($this->scan->$cpm as $class => $value) {
					foreach ($value as $pm => $rvalue) {
						if(isset($rvalue->$annotation))
						{
							$return[$class][$pm] = $rvalue->$annotation;
						}
					}
				}
			}
		}

		if(count($return) == 0 && self::$updated == 0)
		{
			return $this->find($cpm, $annotation, true);
		}
		else
		{
			return $return;
		}
		
	}	

	private function scan()
	{
		unset($this->scan);
		$scanned_directory = $this->findPHPFiles(dirname(dirname(__FILE__)));

		foreach ($scanned_directory as $file) {
			$class = str_replace(".php", "", $file);
			if(class_exists($class))
			{
				$this->scan["class"][$class] = $this->setClass($class)->getClassAnnotations();
				$this->scan["property"][$class] = $this->getPropertiesAnnotations();
				$this->scan["method"][$class] = $this->getMethodsAnnotations();
			}
		}

		if($this->useCache())
		{
			$this->saveCache();
		}

		return $this;
	}

	private function findPHPFiles($dir){
	    $ffs = scandir($dir);
	 	$a = array();

	  	foreach($ffs as $ff){
	    	if($ff != '.' && $ff != '..'){
	    		$file_parts = pathinfo($ff);
	    		if(!empty($file_parts['extension']) && "php" == $file_parts['extension']) 
		    		$a[] = $ff;
		    		if(is_dir($dir.'/'.$ff)) 
	      				$a = array_merge($a, $this->findPHPFiles($dir.'/'.$ff));
	    	}
	  	}
	  	return $a;	
	}

	public function setClass($class)
	{
		$this->reflection = new \ReflectionClass($class);
		return $this;
	}

	public function getClassAnnotations()
	{
		$doc = $this->reflection->getDocComment();
		return $this->catchAnnotations($doc);
	}

	public function getPropertiesAnnotations()
	{
		$pannot = array();
		$p = $this->reflection->getProperties();
		foreach ($p as $value) {
			$doc = $value->getDocComment();
			$pannot[$value->getName()] = $this->catchAnnotations($doc);
		}
		return $pannot;
	}

	public function getMethodsAnnotations()
	{
		$mannot = array();
		$p = $this->reflection->getMethods();
		foreach ($p as $value) {
			$doc = $value->getDocComment();
			$mannot[$value->getName()] = $this->catchAnnotations($doc);
		}
		return $mannot;
	}

	private function catchAnnotations($doc)
	{
		preg_match_all('#@(.*?)\n#s', $doc, $annotations);

		$annot = $this->parseAnnotation($annotations[1]);

		return $annot;
	}

	private function parseAnnotation($annotations)
	{
		$parse = array();
		foreach ($annotations as $value) {
			if(strpos($value, "(") > 0)
			{
				$value = substr($value, 0, -2);
				$value = explode("(", $value, 2);
				$parse[$value[0]] = $this->parseParams($value[1]);
			}
			else
			{
				$value = substr($value, 0, -1);
				$parse[$value] = true;
			}
		}

		return $parse;
	}

	private function parseParams($params)
	{
		$final = array();

		$comma = explode("|", $params);
		foreach ($comma as $value) {
			$equal = explode("=", $value);
			$final[$equal[0]] = isset($equal[1]) ? Functions::isJson($equal[1]) ? json_decode($equal[1]) : $equal[1] : true;
		}
		return $final;
	}

	public function useCache()
	{
		return $this->usecache;
	}

	public function loadCache()
	{
		$this->scan = Cache::getJsonData(__CLASS__);
		return $this;
	}

	public function saveCache()
	{
		Cache::setJsonData(__CLASS__, $this->scan);
		return $this;
	}

	private function parseToObject()
	{
		$this->scan = json_encode($this->scan);
		$this->scan = json_decode($this->scan);
	}
}
?>