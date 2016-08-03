<?php
namespace B7KP\Form;

use B7KP\Library\Options;
use B7KP\Library\Route;

class UserEditDayForm extends Form
{

	function __construct(){}

	public function build($obj = false)
	{
		$this->obj = $obj;
		$options = new Options();
		$day = $options->get("\B7KP\Entity\Settings", "start_day");
		$form = $this
				->init(Route::url("edit_profile_day"))
				->add(self::TYPE_SELECT, "start_day", "form-control", $day,"start_day")
				->add(self::TYPE_SUBMIT, "submit", "send btn btn-success")
				->end();
	}

}
?>