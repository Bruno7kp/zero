<?php
/**
* src/Controller/ProfileController.class.php
*/
class ProfileController extends Controller
{
	
	function __construct(MainFactory $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=profile|route=/profile/{login})
	*/
	public function profileAction($login)
	{
		$user = $this->factory->findOneBy("User", $login, "login");
		if($user instanceof User)
		{
			$lfm = new LastFm();
			$last = $lfm->setUser($user->login)->getUserInfo();
			$acts = $lfm->getUserTopArtist(array("limit" => 1, "period" => "overall"));
			$topact = false; $bgimage = false;
			if(isset($acts[0])): 
				$topact = $acts[0];
				$bgimage = $acts[0]["images"]["mega"]; 
			endif;
			$var = array
					(
						"user" => $user, 
						"lfm_href" => $last["url"], 
						"lfm_image" => str_replace("34s", "avatar170s", $last["image"]),
						"lfm_playcount" => $last["playcount"],
						"lfm_age" => $last["age"],
						"lfm_country" => $last["country"],
						"lfm_bg" => $bgimage,
						"lfm_topact" => $topact
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
			$this->redirectToRoute("home");
		}
	}
}
?>