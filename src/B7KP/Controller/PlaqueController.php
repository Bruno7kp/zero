<?php 
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Utils\UserSession;
use B7KP\Utils\Login;
use B7KP\Entity\User;
use B7KP\Library\Assert;
use B7KP\Library\Url;
use B7KP\Library\Route;
use B7KP\Library\Lang;
use LastFmApi\Main\LastFm;

class PlaqueController extends Controller
{

	private $plaques;

	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=plaque_redirect|route=/user/{login}/plaques)
	*/
	public function redirectAction($login)
	{
		$this->checkAccess();
		$user = $this->isValidUser($login);
		$this->redirectToRoute("plaque_gallery", array('login' => $login, 'type' => 'album', 'by' => 'artist'));
	}

	/**
	* @Route(name=plaque_gallery|route=/user/{login}/plaques/{type}/by/{by})
	*/
	public function plaquesGallery($login, $type, $by)
	{
		$this->checkAccess();
		$user = $this->isValidUser($login);
		$this->isValidType($type, $user->login);
		$this->isValidBy($by, $user->login);

		$vars = array("by" => $by, "type" => $type, "user" => $user,"lfm_bg" => $this->getUserBg($user), "lfm_image" => $this->getUserBg($user, true));
		$this->plaques = $this->factory->find("B7KP\Entity\Plaque", array("iduser" => $user->id), "date DESC");
		$this->orgPlaques($by);
		$vars["plaques"] = $this->plaques;
		$this->render("plaques_gallery.php", $vars);
	}

	private function orgPlaques($by)
	{
		if(count($this->plaques) == 0){ return array(); }

		$array = array();
		if ($by == "week") 
		{
			foreach ($this->plaques as $pk => $pv) 
			{

				$wknd = $this->getWeekEndDate($pv->date);
				if(!isset($array[$wknd]))
				{
					$array[$wknd] = array();
				}
				$array[$wknd][] = $pv;
			}
		}
		else
		{
			foreach ($this->plaques as $pk => $pv) 
			{

				$artist = $pv->artist;
				if(!isset($array[$artist]))
				{
					$array[$artist] = array();
				}
				$array[$artist][] = $pv;
			}
		}

		$this->plaques = $array;
	}

	private function getWeekEndDate($date)
	{
		$date = new \DateTime("this Sunday ".$date);
		return $date->format("d-m-Y");
	}

	protected function isValidUser($login)
	{
		$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
		if($user instanceof User)
		{
			return $user;
		}
		else
		{
			$this->redirectToRoute("404");
		}
	}

	protected function isValidBy($by, $login)
	{
		if($by != "artist" && $by != "week")
		{
			$this->redirectToRoute("plaque_redirect", array('login' => $login));
		}
	}

	protected function isValidType($type, $login)
	{
		if($type != "music" && $type != "album")
		{
			$this->redirectToRoute("plaque_redirect", array('login' => $login));
		}
	}

	protected function getUserBg($user, $avatar = false)
	{
		$lfm 	= new LastFm();
		$last 	= $lfm->setUser($user->login)->getUserInfo();
		if($avatar)
		{
			$bgimage = str_replace("34s", "avatar170s", $last["image"]);
		}
		else
		{
			$acts 	= $lfm->getUserTopArtist(array("limit" => 1, "period" => "overall"));
			$bgimage = false;
			if(isset($acts[0])): 
				$bgimage = $acts[0]["images"]["mega"];
			endif;
		}

		return $bgimage;
	}


	protected function checkAccess()
	{
		return true;
	}
}
?>