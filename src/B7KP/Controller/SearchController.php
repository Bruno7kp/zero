<?php
namespace B7KP\Controller;

use B7KP\Entity\User;
use B7KP\Utils\UserSession;
use B7KP\Library\Notify;
use B7KP\Model\Model;
use B7KP\Core\Dao;
use LastFmApi\Main\LastFm;

class SearchController extends Controller
{
	protected $user, $user_lib, $lastfm, $search, $type, $q;
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
		$this->user = UserSession::getUser($this->factory);
		$this->lastfm = new LastFm();
		$this->dao = Dao::getConn();
	}

	/**
	* @Route(name=search|route=/user/{login}/search/{type})
	*/
	public function userSearch($login, $type)
	{
		$this->type = $type;
		$this->user_lib = $this->isValidUser($login);
		$this->isValidSearch();
		$this->render("search.php", array("lfm_image" => $this->getUserBg($this->guessUser(), true)));
	}

	private function isValidSearch()
	{
		if(isset($_GET["q"]) && !empty($_GET["q"])){
			$this->q = $_GET["q"];
			$this->search = $this->lastfm->search($this->type, $this->q);
			$this->checkResults();
		}else{
			$this->search = false;
		}	
	}

	private function checkResults()
	{
		if($this->search)
		{
			foreach ($this->search as $key => $value) 
			{
				$this->search[$key]["logged_lib"] = false;
				$this->search[$key]["this_lib"] = false;
				switch ($this->type) {
					case 'artist':
						$query = "SELECT t.id FROM artist_charts t, week w WHERE w.id = t.idweek AND t.artist = '".addslashes($value["name"])."' AND w.iduser = ";
						break;

					case 'album':
						$query = "SELECT t.id FROM album_charts t, week w WHERE w.id = t.idweek AND t.artist = '".addslashes($value["artist"])."' AND t.album = '".addslashes($value["name"])."' AND w.iduser = ";
						break;
					
					default:
						$query = "SELECT t.id FROM music_charts t, week w WHERE w.id = t.idweek AND t.artist = '".addslashes($value["artist"])."' AND t.music = '".addslashes($value["name"])."' AND w.iduser = ";
						break;
				}
				if($this->user)
				{
					$match = $this->dao->run($query.$this->user->id);
					$this->search[$key]["logged_lib"] = count($match) > 0;
				}
				if($this->user_lib)
				{
					$match = $this->dao->run($query.$this->user_lib->id);
					$this->search[$key]["this_lib"] = count($match) > 0;
				}

			}
		}
	}

	/**
	* @Route(name=search_all|route=/search/{type})
	*/
	public function overallSearch($type)
	{
		$this->type = $type;
		$this->user_lib = false;
		$this->isValidSearch();
		$this->render("search.php");
	}

	protected function checkAccess()
	{
		return true;
	}

	protected function isValidUser($login)
	{
		$user = $this->factory->findOneBy("B7KP\Entity\User", $login, "login");
		if($user instanceof User)
		{
			$perm = new \B7KP\Utils\PermissionCheck("User");
			$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
			$visibility = $perm->viewPermission($user, $this->factory, $settings->visibility);
			if($visibility)
			{
				if($this->user instanceof User && $user->id == $this->user->id)
				{
					$user = false;
				}
				return $user;
			}
			else
			{
				$this->redirectToRoute("profile", array("login" => $user->login));
			}
		}
		else
		{
			$this->redirectToRoute("404");
		}
	}

	protected function guessUser()
	{
		if($this->user_lib)
		{
			return $this->user_lib->login;
		}
		elseif($this->user)
		{
			return $this->user->login;
		}
		else
		{
			return false;
		}
	}

	protected function getUserBg($user, $avatar = false)
	{
		$lfm 	= new LastFm();
		$last 	= $lfm->setUser($user)->getUserInfo();
		if($avatar)
		{
			$bgimage = str_replace("34s", "avatar170s", $last["image"]);
		}
		else
		{
			return false; // last.fm não envia mais imagens do artista
			$acts 	= $lfm->getUserTopArtist(array("limit" => 1, "period" => "overall"));
			$bgimage = false;
			if(isset($acts[0])): 
				$bgimage = $acts[0]["images"]["mega"];
			endif;
		}

		return $bgimage;
	}
}
?>