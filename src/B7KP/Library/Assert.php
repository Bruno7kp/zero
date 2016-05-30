<?php 
namespace B7KP\Library;

use B7KP\Core\Dao;
use B7KP\Model\Model;
use B7KP\Utils\Functions;
use B7KP\Utils\UserSession;
use LastFmApi\Main\LastFm;

class Assert
{
	private $asserts;
	private $class;
	private $data;
	private $factory;
	private $error = array();
	
	function __construct()
	{
		$reader = new AnnotationReader();
		$this->asserts = $reader->find("property","Assert");
		$dao = Dao::getConn();
		$this->factory = new Model($dao);
	}

	public function check($class, $data, $matchall = true, $returnnotset = true)
	{
		if(class_exists($class))
		{
			$parent = get_parent_class($class);

			if(isset($this->asserts[$class]) || isset($this->asserts[$parent]))
			{
				$this->class = $class;
				$this->data = $data;
				$this->validate($matchall, $returnnotset);
			}
			else
			{
				throw new \Exception("Assert not defined");
			}
		}
		else
		{
			throw new \Exception("Class not exists: ".$class." at ".__FILE__." on ".__LINE__);
		}

		return $this->error;
	}

	public function addAssert($class, $property, $args)
	{
		$this->asserts[$class][$property] = $args;
	}

	private function validate($matchall = true, $returnnotset = true)
	{
		$verify = array();
		if(isset($this->asserts[$this->class]))
		{
			$verify = array_merge($verify, $this->asserts[$this->class]);
		}
		$parent = get_parent_class($this->class);
		if(isset($this->asserts[$parent]))
		{
			$verify = array_merge($this->asserts[$parent], $verify);
		}

		if($matchall)
		{
			foreach ($verify as $field => $items) {
				if(isset($this->data->$field))
				{
					foreach ($items as $assert => $rule) {
						if(method_exists($this, $assert))
						{
							$this->$assert($rule, $field);
						}
						else
						{
							throw new \Exception("Type of assert not valid: ".$assert);
						}
					}
				}
				elseif($returnnotset)
				{
					$this->error[] = array("field" => $field, "error" => "<b>{$field}</b> is not set");
				}
			}
		}
		else
		{
			foreach ($this->data as $field => $value) {
				if(isset($verify[$field]))
				{
					foreach ($verify[$field] as $assert => $rule) {
						if(method_exists($this, $assert))
						{
							$this->$assert($rule, $field);
						}
						else
						{
							throw new \Exception("Type of assert not valid: ".$assert);
						}
					}
				}
				elseif($returnnotset)
				{
					$this->error[] = array("field" => $field, "error" => "Assert for <b>{$field}</b> is not set");
				}
			}
		}
	}

	public function getErrors($ignore = array())
	{
		$errors = array();
		foreach ($this->error as $value) {
			if(!in_array($value["fn"], $ignore))
			{
				$errors[] = $value;
			}
		}
		return $errors;
	}

	private function null($rule, $field)
	{
		if(!filter_var($rule, FILTER_VALIDATE_BOOLEAN))
		{
			if(strlen($this->data->$field) == 0)
			{
				$this->error[] = array("field" => $field, "error" => "<b>{$field}</b> can not be null", "fn" => __FUNCTION__);
			}
		}
	}

	private function alfanum($rule, $field)
	{
		if($rule)
		{
			if(!preg_match('/^[a-zA-Z0-9]+$/', $this->data->$field))
			{
				$this->error[] = array("field" => $field, "error" => "Only letter and numbers are acceptable to field: <b>{$field}</b>", "fn" => __FUNCTION__);
			}
		}
	}

	private function max($rule, $field)
	{
		if(strlen($this->data->$field) > $rule)
		{
			$this->error[] = array("field" => $field, "error" => "{$rule} is the max number of characters permitted for: <b>{$field}</b>", "fn" => __FUNCTION__);	
		}
	}

	private function min($rule, $field)
	{
		if(strlen($this->data->$field) < $rule)
		{
			$this->error[] = array("field" => $field, "error" => "{$rule} is the min number of characters permitted for: <b>{$field}</b>", "fn" => __FUNCTION__);	
		}
	}

	private function email($rule, $field)
	{
		if($rule)
		{
			if(!filter_var($this->data->$field,FILTER_VALIDATE_EMAIL))
			{
				$this->error[] = array("field" => $field, "error" => "Email invalid", "fn" => __FUNCTION__);	
			}
		}
	}

	private function unique($rule, $field)
	{
		if($rule)
		{
			$user = $this->factory->findOneBy($this->class, $this->data->$field, $field);
			if(is_object($user))
			{
				if(isset($this->data->id) && !empty($this->data->id))
				{
					if($user->id != $this->data->id)
					{
						$this->error[] = array("field" => $field, "error" => "The <b>{$field}</b> is already in use", "fn" => __FUNCTION__);
					}
				}
				else
				{
					$this->error[] = array("field" => $field, "error" => "The <b>{$field}</b> is already in use", "fn" => __FUNCTION__);
				}
			}
		}	
	}

	private function int($rule, $field)
	{
		if($rule)
		{
			$this->data->$field = Functions::convertStringToNumeric($this->data->$field);
			if(!is_int($this->data->$field))
			{
				$this->error[] = array("field" => $field, "error" => "The <b>{$field}</b> field must be an integer", "fn" => __FUNCTION__);
			}
		}
	}

	private function number($rule, $field)
	{
		if($rule)
		{
			if(!is_numeric($this->data->$field))
			{
				$this->error[] = array("field" => $field, "error" => "The <b>{$field}</b> field must be a number", "fn" => __FUNCTION__);
			}
		}
	}

	private function maxNum($rule, $field)
	{
		if($this->data->$field > $rule)
		{
			$this->error[] = array("field" => $field, "error" => "The <b>{$field}</b> field must be lower than {$rule}", "fn" => __FUNCTION__);
		}
	}

	private function minNum($rule, $field)
	{
		if($this->data->$field < $rule)
		{
			$this->error[] = array("field" => $field, "error" => "The <b>{$field}</b> field must be bigger than {$rule}", "fn" => __FUNCTION__);
		}
	}

	private function equal($rule, $field)
	{
		if($rule != $this->data->$field)
		{
			$this->error[] = array("field" => $field, "error" => "The <b>{$field}</b> field must be equal to {$rule}", "fn" => __FUNCTION__);
		}
	}

	private function different($rule, $field)
	{
		$rule = Functions::arrayMaker($rule);
		foreach ($rule as $value) {
			if($value == $this->data->$field)
			{
				$this->error[] = array("field" => $field, "error" => "Invalid value in field <b>{$field}</b>: '{$value}', try another", "fn" => __FUNCTION__);
			}
		}
	}

	private function contain($rule, $field)
	{
		if(!empty($this->data->$field) && !empty($rule))
		{
			if (strpos($this->data->$field, $rule) === false) 
			{
				$this->error[] = array("field" => $field, "error" => "The <b>{$field}</b> field must contain <b>{$rule}</b>", "fn" => __FUNCTION__);
			}
		}
	}

	private function notContain($rule, $field)
	{
		if(!empty($this->data->$field) && !empty($rule))
		{
			if (strpos($this->data->$field, $rule) !== false) 
			{
				$this->error[] = array("field" => $field, "error" => "The <b>{$field}</b> field must not contain <b>{$rule}</b>", "fn" => __FUNCTION__);
			}
		}
	}

	private function equalFields($rule, $field)
	{
		if(isset($this->data->$rule) && $this->data->$rule != $this->data->$field)
		{
			$this->error[] = array("field" => $field, "error" => "The <b>{$field}</b> field must be equal to the <b>{$rule}</b> field", "fn" => __FUNCTION__);
		}
	}

	private function differentFields($rule, $field)
	{
		if(isset($this->data->$rule) && $this->data->$rule == $this->data->$field)
		{
			$this->error[] = array("field" => $field, "error" => "The <b>{$field}</b> field must be different of the <b>{$rule}</b> field", "fn" => __FUNCTION__);
		}
	}

	private function notContainFields($rule, $field)
	{
		if(isset($this->data->$rule) && !empty($this->data->$rule) && !empty($this->data->$field))
		{
			if (strpos($this->data->$field, $this->data->$rule) !== false) {
				$this->error[] = array("field" => $field, "error" => "The <b>{$field}</b> field should not contain the same value of the <b>{$rule}</b> field", "fn" => __FUNCTION__);
			}
		}
	}

	private function lastfm($rule, $field)
	{
		if($rule)
		{
			$lastfm = new LastFm();
			$vars = array('user' => $this->data->$field);
			if($lastfm->getUserInfo($vars) === false)
			{
				$this->error[] = array("field" => $field, "error" => "Last.fm username not found", "fn" => __FUNCTION__);
			}
		}
	}
}
?>