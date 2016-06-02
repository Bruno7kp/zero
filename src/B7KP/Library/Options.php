<?php 
namespace B7KP\Library;

use B7KP\Core\Dao;
use B7KP\Model\Model;
use B7KP\Utils\Functions;
use B7KP\Library\Lang;

class Options
{
	private $options;
	private $class;
	private $factory;
	
	function __construct()
	{
		$reader = new AnnotationReader();
		$this->options = $reader->find("property","Options");
		$dao = Dao::getConn();
		$this->factory = new Model($dao);
	}

	public function get($class, $property)
	{
		if(class_exists($class))
		{
			if(isset($this->options[$class][$property]))
			{
				if(isset($this->options[$class][$property]->settings))
				{
					$arr = (array) $this->options[$class][$property]->values;
					return $this->settings($this->options[$class][$property]->settings, $arr);
				}
				else
				{
					return (array) $this->options[$class][$property]->values;
				}
			}
		}

		return array();
	}

	private function settings($set, $arr)
	{
		foreach ($set as $key => $value) {
			$arr = $this->$key($value, $arr);
		}

		return $arr;
	}

	private function translate($val, $arr)
	{
		if($val)
		{
			$narr = array();
			foreach ($arr as $key => $value) {
				$narr[$key] = Lang::get($value);
			}
			$arr = $narr;
		}

		return $arr;
	}
}
?>