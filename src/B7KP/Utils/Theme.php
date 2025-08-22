<?php 
namespace B7KP\Utils;

use B7KP\Core\Dao;
use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Library\Url;
use B7KP\Entity\Settings;

class Theme
{
	const LIGHT 	= 0;
	const DARK 		= 1;

	static function getUserTheme()
	{
		$dao = Dao::getConn();
		$factory = new Model($dao);
		$u = UserSession::getUser($factory);
		if($u == false)
		{
			return false;
		}
		$val = Settings::defaultValueFor("theme");
		$s = $factory->findOneBy("B7KP\Entity\Settings", $u->id, "iduser");
		if($s instanceof Settings)
		{
			$val = $s->theme;
		}

		return $val;
	}

	static function getThemeFiles($theme, $mainbs = true)
	{
		switch ($theme) {
			case 1:
				if($mainbs){
					$html = "<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/cyborg/bootstrap.min.css\" class=\"themedark\">";
				}else{
					$html = "<link rel=\"stylesheet\" href=\"".Url::asset('css/custom-dark.css?v=3.81')."\" class=\"themedark\"><script>theme = 1;</script>";
				}

				
				break;
			
			default:
				if($mainbs){
					$html = "<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.6/css/bootstrap.min.css\" class=\"themelight\">";
				}else{
					$html = "<script>theme = 0;</script>";
				}
				break;
		}

		return $html;
	}
}
?>