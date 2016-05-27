<?php
namespace B7KP\Form;

use B7KP\Library\Route;

class UserEditForm extends Form
{

	function __construct(){}

	public function build($obj = false)
	{
		$this->obj = $obj;
		$form = $this
				->init(Route::url("edit_profile"))
				->add(self::TYPE_MAIL, "email", "input-lg form-control")
				->add(self::TYPE_SUBMIT, "submit", "send btn btn-primary btn-lg")
				->end();
	}

}
?>