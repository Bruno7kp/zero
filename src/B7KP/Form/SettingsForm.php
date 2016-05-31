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
		$img = $options->get("\B7KP\Entity\Settings", "show_images");
		$drp = $options->get("\B7KP\Entity\Settings", "show_dropouts");
		$fir = $options->get("\B7KP\Entity\Settings", "show_first_image");
		$mov = $options->get("\B7KP\Entity\Settings", "show_move");
		$pts = $options->get("\B7KP\Entity\Settings", "show_playcounts");
		$form = $this
				->init(Route::url("change_settings"))
				->add(self::COMMENT, "<p class='text-muted'>Here you can select the item limit of your weekly chart. Putting a limit, items that fall below this limit are ignored when generating your data, preventing your graphics become polluted, but if you want to take advantage of all the data, you can select the 'Max' option.</p>", "form-group text-justify")
				->add(self::TYPE_SELECT, "art_limit", "form-control", $art,"Top x Artists")
				->add(self::TYPE_SELECT, "alb_limit", "form-control", $alb,"Top x Albuns")
				->add(self::TYPE_SELECT, "mus_limit", "form-control", $mus,"Top x Musics")
				->add(self::COMMENT, "<p class='text-muted'>Here you can customize your charts.</p>", "form-group text-center")
				->add(self::TYPE_SELECT, "show_images", "form-control", $img,"Show images on the chart")
				->add(self::TYPE_SELECT, "show_dropouts", "form-control", $drp,"Show dropouts at the end of the chart")
				->add(self::TYPE_SELECT, "show_first_image", "form-control", $fir,"Show image of the number one in the top of the chart")
				->add(self::TYPE_SELECT, "show_move", "form-control", $mov,"What type of 'move' do you want?")
				->add(self::TYPE_SELECT, "show_playcounts", "form-control", $pts,"Show playcounts")
				->add(self::TYPE_SUBMIT, "save", "send btn btn-success")
				->end();
	}

}
?>