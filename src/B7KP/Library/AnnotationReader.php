<?php 
namespace B7KP\Library;

use B7KP\Interfaces\iCache;
use B7KP\Utils\Cache;
use B7KP\Utils\Functions;

class AnnotationReader implements iCache
{
	private $reflection;
	private $scan;
	private $usecache = true;
	private static $updated = 0;
	private static $real_cache = false;
	
	function __construct()
	{
		if($this->useCache())
		{
			$this->loadCache();
		}
	}

	/**
	* $cpm = Class(e)/Property(Propriedade/Atributo)/Method(Método)
	* Se $usecache for 'true', vai ser carregado os dados do arquivo json correspondente
	* Se $forceupdate for 'true', antes de carregar, o arquivo será atualizado
	* Se $usecache for 'false', $forceupdate também será, já que o arquivo não será utilizado
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
		$scanned_directory = $this->findPHPFiles();

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

	private function findPHPFiles($dir = MAIN_DIR.'src/', $replace = MAIN_DIR.'src/'){
	    $ffs = scandir($dir);
	 	$a = array();

	  	foreach($ffs as $ff){
	    	if($ff != '.' && $ff != '..'){
	    		$file_parts = pathinfo($ff);
	    		if(!empty($file_parts['extension']) && "php" == $file_parts['extension']) 
		    		$a[] = str_replace("/", "\\", str_replace($replace, "", $dir)."\\".$ff);
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
				$value = rtrim($value);
				$value = rtrim($value, ")");
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
		if(self::$real_cache === false){
			self::$real_cache = Cache::getJsonData(__CLASS__);
		}
		$this->scan = self::$real_cache;
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