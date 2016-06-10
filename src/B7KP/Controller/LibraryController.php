<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Utils\UserSession;
use B7KP\Utils\Charts;
use B7KP\Utils\Snippets;
use B7KP\Entity\User;
use B7KP\Library\Lang;
use LastFmApi\Main\LastFm;

class LibraryController extends Controller
{
	protected $user;
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=lib_art_list|route=/user/{login}/charts/artists)
	*/
	public function artistList($login)
	{
		$user = $this->isValidUser($login);
		$chart = new Charts($this->factory, $user);
		$settings = $this->factory->findOneBy("B7KP\Entity\Settings", $user->id, "iduser");
		$lastfm = new Lastfm();
		$lastfm->setUser($user->login);
		$page = isset($_GET["page"]) ? intval($_GET["page"]) : 1;
		$v = array
				(
					"period" => "overall",
					"limit" => 50,
					"page" => $page
				);
		$top = $lastfm->getUserTopArtist($v);
		$info = $top["info"];
		unset($top["info"]);
		$list = array();

		if(is_array($top) && count($top) > 0)
		{
			foreach ($top as $key => $value) {
				$list[$key]["artist"] = $value["name"];
				$list[$key]["rank"] = $value["rank"];
				$list[$key]["playcount"] = $value["playcount"];
				$list[$key]["img"] = $value["images"]["large"];
				$stats = $chart->getArtistStats($value["name"], "");
				$list[$key]["stats"] = $chart->extract($stats, false);
			}
		}

		$dao = Dao::getConn();

		$vars = array
					(
						"user" => $user,
						"list" => $list,
						"info" => $info,
						"page" => $page,
						"limit"		=> $settings->art_limit,
						"lfm_bg" 	=> $this->getUserBg($user),
						"lfm_image" => $this->getUserBg($user, true),
						"biggest_playcount" => $this->getBiggestPlaycount($user)
					);

		$this->render("lib_art.php", $vars);
	}

	/**
	* @Route(name=lib_mus_list|route=/user/{login}/charts/musics)
	*/
	public function musicList($login)
	{
		$user = $this->isValidUser($login);
		$lastfm = new Lastfm();
		$lastfm->setUser($user->login);
		$dao = Dao::getConn();

	}

	/**
	* @Route(name=lib_alb_list|route=/user/{login}/charts/albums)
	*/
	public function albumList($login)
	{
		$user = $this->isValidUser($login);
		$lastfm = new Lastfm();
		$lastfm->setUser($user->login);
		$dao = Dao::getConn();

	}

	protected function getBgImage($artist)
	{
		$img = null;
		if(isset($artist["images"]))
		{
			if(isset($artist["images"]["mega"]))
			{
				$img = $artist["images"]["mega"];
			}
			else
			{
				if(isset($artist["images"]["extralarge"]))
				{
					$img = $artist["images"]["extralarge"];
				}
				else
				{
					if(isset($artist["images"]["large"]))
					{
						$img = $artist["images"]["large"];
					}
					else
					{
						if(isset($artist["images"]["medium"]))
						{
							$img = $artist["images"]["medium"];
						}
					}
				}
			}
		}

		return $img;
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

	protected function getBiggestPlaycount($user)
	{
		$lfm 	= new LastFm();
		$lfm->setUser($user->login);
		$acts 	= $lfm->getUserTopArtist(array("limit" => 1, "period" => "overall"));
		$plays = 0;
		if(isset($acts[0]["playcount"])): 
			$plays = $acts[0]["playcount"];
		endif;


		return $plays;
	}

	protected function checkAccess()
	{
		return true;
	}

}
?>