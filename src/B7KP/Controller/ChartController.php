<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Utils\Snippets;
use B7KP\Utils\Charts;
use B7KP\Entity\User;
use B7KP\Entity\Settings;
use B7KP\Entity\Week;
use LastFmApi\Main\LastFm;

class ChartController extends Controller
{
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=chart_list|route=/user/{login}/charts)
	*/
	public function chartsIndex($login)
	{
		$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
		if($user instanceof User)
		{
			$lfm 	= new LastFm();
			$last 	= $lfm->setUser($user->login)->getUserInfo();
			$date 	= \DateTime::createFromFormat("U",$last['registered'])->format("Y.m.d");
			$acts 	= $lfm->getUserTopArtist(array("limit" => 1, "period" => "overall"));
			$wksfm 	= $lfm->getWeeklyChartList();
			$wksfm 	= count($lfm->removeWeeksBeforeDate($wksfm, $date));
			$average = $last['playcount'] / $wksfm;
			$weeks 	= $this->factory->find("B7KP\Entity\Week", array("iduser" => $user->id), "week DESC");
			$bgimage = false;
			$topartist = false;
			if(isset($acts[0])): 
				$bgimage = $acts[0]["images"]["mega"];
				$topartist = $acts[0];
			endif;
			$var = array
					(
						"user" 			=> $user, 
						"lfm_href" 		=> $last["url"], 
						"lfm_image" 	=> str_replace("34s", "avatar170s", $last["image"]),
						"lfm_playcount" => $last["playcount"],
						"lfm_country" 	=> $last["country"],
						"lfm_bg" 		=> $bgimage,
						"lfm_register"	=> $date,
						"weeks" 		=> $weeks,
						"weekstodate"	=> $wksfm,
						"topartist"		=> $topartist,
						"average"		=> round($average)
					);
			$this->render("profile.php", $var);
		}
		else
		{
			$this->redirectToRoute("registernotfound", array("entity" => "user"));
		}
	}

	/**
	* @Route(name=weekly_chart|route=user/{login}/charts/{type}/week/{week})
	*/
	public function weeklyChart($login, $type, $week)
	{
		$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
		$validtype = ($type == "artist" || $type == "album" || $type == "music");
		if($user instanceof User && $validtype && is_numeric($week))
		{
			$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
			$week = $this->factory->find("B7KP\Entity\Week", array("iduser" => $user->id, "week" => $week), "week DESC");
			if(is_array($week) && count($week) > 0)
			{
				$limit = 10;
				if($settings instanceof Settings)
				{
					$prop = substr($type, 0, 3) . "_limit";
					$limit = $settings->$prop;
				}
				$week = $week[0];
				$chart = new Charts($this->factory, $user);
				$list = $chart->getWeeklyCharts($week, $type, $limit, true, $settings);
				$vars = array('user' => $user, 'list' => $list, 'type' => $type, 'week' => $week);
				$this->render("chart.php", $vars);
			}
			else
			{
				$this->redirectToRoute("registernotfound", array("entity" => "Week"));
			}
		}
		else
		{
			$this->redirectToRoute("registernotfound", array("entity" => "User"));
		}
	}


	protected function checkAccess()
	{
		if(UserSession::getUser($this->factory) == false)
		{
			$this->redirectToRoute("login");
		}
	}
}
?>