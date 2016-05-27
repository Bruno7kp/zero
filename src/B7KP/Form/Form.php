<?php
namespace B7KP\Form;

abstract class Form
{
	protected $form = "";
	protected $obj 	= false;

	const TYPE_TEXT 	= 0;
	const TYPE_PASS 	= 1;
	const TYPE_MAIL 	= 2;
	const TYPE_HIDDEN 	= 3;
	const TYPE_SELECT 	= 4;
	const TYPE_CHECK 	= 5;
	const TYPE_RADIO 	= 6;
	const TYPE_FILE 	= 7;
	const TYPE_BIG_TEXT = 8;
	const TYPE_SUBMIT 	= 9;
	const SEPARATOR 	= 10;
	const COMMENT 		= 11;

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

	final protected function add($type, $name, $class = "form-control", $options = array(), $placeholder = false)
	{
		switch ($type) {
			case self::TYPE_TEXT:
				$this->input("text", $name, $class, $placeholder);
				break;
			case self::TYPE_BIG_TEXT:
				$this->textarea($name, $class);
				break;
			case self::TYPE_PASS:
				$this->input("password", $name, $class, $placeholder);
				break;
			case self::TYPE_MAIL:
				$this->input("email", $name, $class, $placeholder);
				break;
			case self::TYPE_HIDDEN:
				$this->input("hidden", $name, $class, $placeholder);
				break;
			case self::TYPE_SELECT:
				$this->select($name, $class, $options, $placeholder);
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
			case self::SEPARATOR:
				$this->separator($name);
				break;
			case self::COMMENT:
				$this->comment($name, $class);
				break;
			
			default:
				throw new Exception("Form type not found");
				break;
		}

		return $this;
	}

	final protected function input($type, $name, $class, $placeholder)
	{
		if(!$placeholder): $placeholder = ucfirst($name); endif;
		$value = $this->checkValue($name);
		$this->form .= "<div class='form-group'>";
		$this->form .= "<input type='".$type."' name='".$name."' class='".$class."' value='".$value."' placeholder='".$placeholder."'>";
		$this->form .= "</div>";
	}

	final protected function submit($name, $class)
	{
		$this->form .= "<div class='form-group'>";
		$this->form .= "<button type='submit' class='".$class."'>".$name."</button>";
		$this->form .= "</div>";
	}

	final protected function select($name, $class, $options, $placeholder)
	{
		$value = $this->checkValue($name);
		$this->form .= "<div class='form-group'>";
		if(!empty($placeholder)):
			$this->form .= "<label>".$placeholder."</label>";
		endif;
		$this->form .= "<select class='".$class."' name='".$name."'>";
		foreach ($options as $key => $option) {
			if($value == $option):
				$this->form .= "<option value='".$key."' selected>".$option."</option>";
				continue;
			endif;
			$this->form .= "<option value='".$key."'>".$option."</option>";
		}
		$this->form .= "</select>";
		$this->form .= "</div>";
	}

	final protected function separator($name)
	{
		$div = "<hr/>";
		$accept = array("hr" => "<hr/>", "br" => "<br/>");
		if(array_key_exists($name, $accept))
		{
			$div = $accept[$name];
		}
		$this->form .= $div;
	}

	final protected function comment($name, $class)
	{
		$this->form .= "<div class='".$class."'>";
		$this->form .= $name;
		$this->form .= "</div>";
	}

	final protected function checkValue($name)
	{
		$value = "";
		if($this->obj)
		{
			if(is_object($this->obj) && isset($this->obj->$name))
			{
				$value = $this->obj->$name;
			}
			elseif(is_array($this->obj) && isset($this->obj[$name]))
			{
				$value = $this->obj[$name];
			}
		}
		return $value;
	}
}
?>