<?php
namespace B7KP\Form;

use B7KP\Library\Route;
use B7KP\Library\Options;

class SettingsForm extends Form
{

	function __construct(){}

	public function build($obj = false)
	{
		$this->obj = $obj;
		$options = new Options();
		$art = $options->get("\B7KP\Entity\Settings", "art_limit");
		$alb = $options->get("\B7KP\Entity\Settings", "alb_limit");
		$mus = $options->get("\B7KP\Entity\Settings", "mus_limit");
		$form = $this
				->init(Route::url("change_settings"))
				->add(self::COMMENT, "<p class='text-muted'>Here you can select the item limit of your weekly chart. Putting a limit, items that fall below this limit are ignored when generating your data, preventing your graphics become polluted, but if you want to take advantage of all the data, you can select the 'Max' option.</p>", "form-group text-justify")
				->add(self::TYPE_SELECT, "art_limit", "form-control", $art,"Top x Artists")
				->add(self::TYPE_SELECT, "alb_limit", "form-control", $alb,"Top x Albuns")
				->add(self::TYPE_SELECT, "mus_limit", "form-control", $mus,"Top x Musics")
				->add(self::TYPE_SUBMIT, "save", "send btn btn-success")
				->end();
	}

}
?>