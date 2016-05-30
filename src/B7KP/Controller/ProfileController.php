<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Utils\Snippets;
use B7KP\Entity\User;
use LastFmApi\Main\LastFm;

class ProfileController extends Controller
{
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=profile|route=/user/{login})
	*/
	public function profileAction($login)
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
	* @Route(name=userprofile|route=/profile)
	*/
	public function indexAction()
	{
		$this->checkAccess();
		$user = UserSession::getUser($this->factory);
		$this->redirectToRoute("profile", array("login" => $user->login));
	}

	/**
	* @Route(name=load_all|route=/load_all/{login}/{limit})
	*/
	public function loadAll($login, $limit)
	{
		$all = array();
		ob_start();
		$this->artTopList($login, $limit);
		$all['artist'] = ob_get_clean();
		ob_start();
		$this->musTopList($login, $limit);
		$all['music'] = ob_get_clean();
		ob_start();
		$this->albTopList($login, $limit);
		$all['album'] = ob_get_clean();
		ob_start();
		$this->recentList($login, $limit);
		$all['recent'] = ob_get_clean();
		echo json_encode($all);
	}	

	/**
	* @Route(name=art_top_list|route=/art_top_list/{login}/{limit})
	*/
	public function artTopList($login, $limit)
	{
		if($this->isAjaxRequest())
		{
			$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
			$lfm 	= new LastFm();
			$last 	= $lfm->setUser($user->login);
			$lfm_topacts 	= $lfm->getUserTopArtist(array("limit" => (int)$limit, "period" => "overall"));

			if (count($lfm_topacts) > 0) 
			{
				$html = "";
				foreach ($lfm_topacts as $act) 
				{
					$html .= Snippets::topActListRow($act['name'], $act['url'], $act['playcount'], $act['images']['medium'], $lfm_topacts[0]['playcount']);
				}
				echo $html;
			}
			else
			{
				echo "Nothing to show here.";
			}

		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=alb_top_list|route=/alb_top_list/{login}/{limit})
	*/
	public function albTopList($login, $limit)
	{
		if($this->isAjaxRequest())
		{
			$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
			$lfm 	= new LastFm();
			$last 	= $lfm->setUser($user->login);
			$lfm_topalbs 	= $lfm->getUserTopAlbum(array("limit" => (int)$limit, "period" => "overall"));
			if (count($lfm_topalbs) > 0) 
			{
				$html = "";
				foreach ($lfm_topalbs as $alb) 
				{
					$html .= Snippets::topAlbListRow($alb['name'], $alb['url'], $alb['playcount'], $alb['images']['medium'], $lfm_topalbs[0]['playcount'], $alb['artist']['name'], $alb['artist']['url']);
				}
				echo $html;
			}
			else
			{
				echo "Nothing to show here.";
			}
		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=mus_top_list|route=/mus_top_list/{login}/{limit})
	*/
	public function musTopList($login, $limit)
	{
		if($this->isAjaxRequest())
		{
			$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
			$lfm 	= new LastFm();
			$last 	= $lfm->setUser($user->login);
			$lfm_topmus 	= $lfm->getUserTopMusic(array("limit" => (int)$limit, "period" => "overall"));
			if (count($lfm_topmus) > 0) 
			{
				$html = "";
				foreach ($lfm_topmus as $mus) 
				{
					$html .= Snippets::topAlbListRow($mus['name'], $mus['url'], $mus['playcount'], $mus['images']['medium'], $lfm_topmus[0]['playcount'], $mus['artist']['name'], $mus['artist']['url']);
				}

				echo $html;
			}
			else
			{
				echo "Nothing to show here.";
			}

		}
		else
		{
			$this->redirectToRoute("home");
		}
	}

	/**
	* @Route(name=recent_list|route=/recent_list/{login}/{limit})
	*/
	public function recentList($login, $limit)
	{
		if($this->isAjaxRequest())
		{
			$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
			$lfm 	= new LastFm();
			$last 	= $lfm->setUser($user->login);
			$recent = $lfm->getRecentTrack();
			if(count($recent) > 0)
			{
				$html = "<div class='bottomspace-sm topspace-sm'><h2 class='h3'>RECENT TRACKS</h2></div>";
				foreach ($recent as $key => $value) 
				{
					$html .= Snippets::recentListRow($value['name'], $value['images']['medium'], $value['artist']['name'], $value['album']['name'], $value['url']);
				}
				$html .= "<a class='btn btn-danger btn-block topspace-sm' target='_blank' href='http://last.fm/user/{$user->login}/library'>View more <i class='fa fa-lastfm'></i></a>";
				echo $html;
			}
			else
			{
				echo "Nothing to show here.";
			}
		}
		else
		{
			$this->redirectToRoute("home");
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