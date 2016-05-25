<?php 
namespace B7KP\Entity;

abstract class Entity
{
	/**
	* @Assert(null=true)
	*/
	protected $id;
	
	function __construct(){}

	final public function __get($property)
	{
		return $this->$property;
	}

	function __set($property, $value)
	{
		// Do nothing
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
}
?>