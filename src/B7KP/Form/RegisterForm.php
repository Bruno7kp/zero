<?php
namespace B7KP\Form;

use B7KP\Library\Route;

class RegisterForm extends Form
{

	function __construct(){}

	public function build($obj = false)
	{
		$this->obj = $obj;
		$form = $this
				->init(Route::url("check_register"))
				->add(self::TYPE_HIDDEN, "login", "input-lg form-control", array(), "Last.fm Username")
				->add(self::TYPE_TEXT, "name", "input-lg form-control")
				->add(self::TYPE_MAIL, "email", "input-lg form-control")
				->add(self::TYPE_PASS, "password", "input-lg form-control")
				->add(self::TYPE_SUBMIT, "submit", "send btn btn-primary btn-lg")
				->end();
	}

}
?>