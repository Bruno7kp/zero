<?php
namespace B7KP\Form;

use B7KP\Library\Route;
use B7KP\Library\Options;
use B7KP\Library\Lang;

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
		$img = $options->get("\B7KP\Entity\Settings", "show_images");
		$drp = $options->get("\B7KP\Entity\Settings", "show_dropouts");
		$fir = $options->get("\B7KP\Entity\Settings", "show_first_image");
		$mov = $options->get("\B7KP\Entity\Settings", "show_move");
		$pts = $options->get("\B7KP\Entity\Settings", "show_playcounts");
		$lan = $options->get("\B7KP\Entity\Settings", "lang");
		$tim = $options->get("\B7KP\Entity\Settings", "show_times");
		$liv = $options->get("\B7KP\Entity\Settings", "hide_livechart");
		$form = $this
				->init(Route::url("change_settings"))
				->add(self::TYPE_SELECT, "lang", "form-control", $lan,"language")
				->add(self::TYPE_SELECT, "show_points", "form-control", $pts,"sett_points")
				->add(self::TYPE_SELECT, "hide_livechart", "form-control", $liv,"hide_livechart")
				->add(self::COMMENT, "sett_limit", "form-group text-justify")
				->add(self::TYPE_SELECT, "art_limit", "form-control", $art,"Top x ".Lang::get('art_x'))
				->add(self::TYPE_SELECT, "alb_limit", "form-control", $alb,"Top x ".Lang::get('alb_x'))
				->add(self::TYPE_SELECT, "mus_limit", "form-control", $mus,"Top x ".Lang::get('mus_x'))
				->add(self::COMMENT, "customize", "form-group text-center")
				->add(self::TYPE_SELECT, "show_images", "form-control", $img,"sett_showimg")
				->add(self::TYPE_SELECT, "show_dropouts", "form-control", $drp,"sett_showdrop")
				->add(self::TYPE_SELECT, "show_first_image", "form-control", $fir,"sett_showf_img")
				->add(self::TYPE_SELECT, "show_move", "form-control", $mov,"sett_move")
				->add(self::TYPE_SELECT, "show_playcounts", "form-control", $pts,"sett_plays")
				->add(self::TYPE_SELECT, "show_times", "form-control", $pts,"sett_times")
				->add(self::TYPE_SUBMIT, "save", "send btn btn-success")
				->end();
	}

}
?>