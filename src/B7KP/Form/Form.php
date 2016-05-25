<?php
namespace B7KP\Form;

abstract class Form
{
	protected $form = "";
	protected $obj = false;

	const TYPE_TEXT = 0;
	const TYPE_PASS = 1;
	const TYPE_MAIL = 2;
	const TYPE_HIDDEN = 3;
	const TYPE_SELECT = 4;
	const TYPE_CHECK = 5;
	const TYPE_RADIO = 6;
	const TYPE_FILE = 7;
	const TYPE_SUBMIT = 8;

	function __construct(){}

	abstract public function build();

	final public function output()
	{
		echo $this->form;
	}

	final protected function init($action = false, $id = false, $method = "post", $class = "form")
	{
		$extra = " class='".$class."' ";
		if($id): $extra .= " id='".$id."' "; endif;
		if($method): $extra .= " method='".$method."' "; endif;
		if($action): $extra .= " action='".$action."' "; endif;
		$this->form .= "<form ".$extra.">";
		return $this;
	}

	final protected function end()
	{
		$this->form .= "</form>";
		return $this;
	}

	final protected function add($type, $name, $class = "form-control", $options = array())
	{
		switch ($type) {
			case self::TYPE_TEXT:
				$this->input("text", $name, $class);
				break;
			case self::TYPE_PASS:
				$this->input("password", $name, $class);
				break;
			case self::TYPE_MAIL:
				$this->input("email", $name, $class);
				break;
			case self::TYPE_HIDDEN:
				$this->input("hidden", $name, $class);
				break;
			case self::TYPE_SELECT:
				$this->select($name, $class, $options);
				break;
			case self::TYPE_CHECK:
				$this->checkbox($name, $class, $options);
				break;
			case self::TYPE_RADIO:
				$this->radio($name, $class, $options);
				break;
			case self::TYPE_SUBMIT:
				$this->submit($name, $class);
				break;
			case self::TYPE_FILE:
				$this->file($name, $class, $options);
				break;
			
			default:
				throw new Exception("Form type not found");
				break;
		}

		return $this;
	}

	final protected function input($type, $name, $class)
	{
		$value = $this->checkValue($name);
		$this->form .= "<div class='form-group'>";
		$this->form .= "<input type='".$type."' name='".$name."' class='".$class."' value='".$value."' placeholder='".ucfirst($name)."'>";
		$this->form .= "</div>";
	}

	final protected function submit($name, $class)
	{
		$this->form .= "<div class='form-group'>";
		$this->form .= "<button type='submit' class='".$class."'>".$name."</button>";
		$this->form .= "</div>";
	}

	final protected function checkValue($name)
	{
		$value = "";
		if($this->obj)
		{
			if(is_object($this->obj))
			{
				$value = $this->obj->$name;
			}
			elseif(is_array($obj))
			{
				$value = $this->obj[$name];
			}
		}
		return $value;
	}
}
?>