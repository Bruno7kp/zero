<?php 
namespace B7KP\Library;

use B7KP\Core\Dao;
use B7KP\Model\Model;
use B7KP\Utils\Functions;

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
				return (array) $this->options[$class][$property]->values;
			}
		}

		return array();
	}
}
?>