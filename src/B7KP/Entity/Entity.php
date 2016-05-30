<?php 
namespace B7KP\Entity;

use B7KP\Utils\Pass;

abstract class Entity
{
	/**
	* @Assert(null=true)
	*/
	protected $id;
	
	function __construct(){}

	public function __get($property)
	{
		return $this->$property;
	}

	function __set($property, $value)
	{
		// Do nothing
	}

	function __isset($property)
	{
		return isset($this->$property);
	}

	final private function set($property, $value)
	{
		if($this->setable($property))
		{
			$this->$property = $value;
		}
		return $this;
	}

	protected function setable($property)
	{
		return property_exists($this, $property);
	}

	public function fillData($data)
	{
		foreach ($data as $key => $value) {
			if(property_exists($this, $key))
			{
				$this->$key = $value;
			}
		}
	}

	public function getAllAsArray()
	{
		$data = array();
		$props = get_object_vars($this);
		foreach ($props as $key => $value) {
			$data[$key] = $this->filterDataToDb($key, $this->$key);
		}
		return $data;
	}

	protected function filterDataToDb($column, $value)
	{
		switch ($column) {
			case 'password':
				if(!$this->id)
				{
					$value = Pass::encrypt($value);
				}
				break;
		}

		return $value;
	}

	public static function getTableName()
	{
		$class = explode("\\", get_called_class());
		$class = strtolower(end($class));
		return strtolower($class);
	}
}
?>