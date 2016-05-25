<?php
namespace B7KP\Form;

class UserEditForm extends Form
{

	function __construct(){}

	public function build($obj = false)
	{
		$this->obj = $obj;
		$form = $this
				->init(Route::url("edit_profile"))
				->add(self::TYPE_TEXT, "name", "input-lg form-control")
				->add(self::TYPE_TEXT, "login", "input-lg form-control")
				->add(self::TYPE_MAIL, "email", "input-lg form-control")
				->add(self::TYPE_SUBMIT, "submit", "send btn btn-primary btn-lg")
				->end();
	}

}
?>