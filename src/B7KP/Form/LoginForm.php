<?php
namespace B7KP\Form;

class LoginForm extends Form
{

	function __construct(){}

	public function build($obj = false)
	{
		$this->obj = $obj;
		$form = $this
				->init(Route::url("check_login"))
				->add(self::TYPE_TEXT, "login", "input-lg form-control")
				->add(self::TYPE_PASS, "password", "input-lg form-control")
				->add(self::TYPE_SUBMIT, "submit", "send btn btn-primary btn-lg")
				->end();
	}

}
?>