<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Core\App;
use B7KP\Entity\User;
use B7KP\Utils\UserSession;
use B7KP\Library\Route;
use B7KP\Library\Options;
use B7KP\Library\Lang;
use B7KP\Utils\Pass;

class ChangelogController extends Controller
{

	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=zero_versions|route=/changelog)
	*/
	public function showVersions()
	{
		$changes = array();
		$changes["0.13.000"] = array("15.09.2018", Lang::get("v_cache"));
		$changes["0.12.750"] = array("06.05.2018", Lang::get("v_multiply"));
		$changes["0.12.250"] = array("14.04.2018", Lang::get("v_weekly_cert"), Lang::get("v_others"));
		$changes["0.12.200"] = array("08.04.2018", Lang::get("v_new_cert_type"));
		$changes["0.12.100"] = array("31.12.2016", Lang::get("v_yec"));
		$changes["0.12.000"] = array("20.08.2016", Lang::get("v_search"), Lang::get("v_friends"), Lang::get("v_plaque_chart"), Lang::get("v_others"));
		$changes["0.11.610"] = array("03.08.2016", Lang::get("v_day"), Lang::get("v_update"), Lang::get("v_reset"), Lang::get("v_delete"));
		$changes["0.11.500"] = array("31.07.2016", Lang::get("v_plaque_page"), Lang::get("theme").": Dark", Lang::get("v_new_forum"));
		$changes["0.11.000"] = array("18.07.2016", Lang::get("v_new_faq"), Lang::get("v_new_cl_page"), Lang::get("v_new_cur_page"), Lang::get("v_hide_livechart"));
		$next = array("complete" => 0, "text" => array(Lang::get("v_break")));
		$vars = array("changes" => $changes, "next" => $next);
		$this->render("changelog.php", $vars);
	}

	protected function checkAccess()
	{
		return true;
	}
}
?>