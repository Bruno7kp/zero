<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Entity\User;
use LastFmApi\Main\LastFm;

class ProfileController extends Controller
{
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=profile|route=/profile/{login})
	*/
	public function profileAction($login)
	{
		$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
		if($user instanceof User)
		{
			$lfm 	= new LastFm();
			$last 	= $lfm->setUser($user->login)->getUserInfo();
			$date 	= \DateTime::createFromFormat("U",$last['registered'])->format("Y.m.d");
			$acts 	= $lfm->getUserTopArtist(array("limit" => 5, "period" => "overall"));
			$albs 	= $lfm->getUserTopAlbum(array("limit" => 5, "period" => "overall"));
			$mus 	= $lfm->getUserTopMusic(array("limit" => 5, "period" => "overall"));
			$wksfm 	= $lfm->getWeeklyChartList();
			$wksfm 	= count($lfm->removeWeeksBeforeDate($wksfm, $date));
			$weeks 	= $this->factory->find("B7KP\Entity\Week", array("iduser" => $user->id), "week DESC");
			$recent = $lfm->getRecentTrack();
			$topact = false; $bgimage = false;
			if(isset($acts[0])): 
				$bgimage = $acts[0]["images"]["mega"]; 
			endif;
			$var = array
					(
						"user" 			=> $user, 
						"lfm_href" 		=> $last["url"], 
						"lfm_image" 	=> str_replace("34s", "avatar170s", $last["image"]),
						"lfm_playcount" => $last["playcount"],
						"lfm_country" 	=> $last["country"],
						"lfm_bg" 		=> $bgimage,
						"lfm_topalbs"	=> $albs,
						"lfm_topacts" 	=> $acts,
						"lfm_topmus" 	=> $mus,
						"lfm_register"	=> $date,
						"recent"		=> $recent,
						"weeks" 		=> $weeks,
						"weekstodate"	=> $wksfm
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

	protected function checkAccess()
	{
		if(UserSession::getUser($this->factory) == false)
		{
			$this->redirectToRoute("login");
		}
	}
}
?>