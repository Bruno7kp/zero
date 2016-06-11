<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Utils\UserSession;
use B7KP\Utils\Snippets;
use B7KP\Utils\Functions as F;
use B7KP\Entity\User;
use B7KP\Library\Lang;
use B7KP\Library\Route;
use LastFmApi\Main\LastFm;

class AlbumController extends Controller
{
	protected $user;
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=album|route=/music/{artist}/{name})
	*/
	public function albumMainPage($artist, $name)
	{

		$this->checkAccess();
		$lastfm = new Lastfm();
		$dao = Dao::getConn();

		if($this->user instanceof User)
		{
			$lastfm->setUser($this->user->login);
		}

		$name = str_replace("+", " ", $name);
		$name = str_replace("%252B", "+", $name);
		$artist = str_replace("+", " ", $artist);
		$artist = str_replace("%252B", "+", $artist);

		$album = $lastfm->getAlbumInfo($name, $artist);
		if(is_array($album))
		{
			$usersdata = $dao->run("SELECT count(t.id) as total, u.id as iduser FROM album_charts t, week w, user u WHERE u.id = w.iduser AND t.idweek = w.id AND t.album = '".addslashes($album["name"])."' AND t.artist = '".addslashes($album["artist"])."' AND t.rank = 1 GROUP BY u.id ORDER BY total DESC");
			$totalcharts = $dao->run("SELECT count(t.id) as total, u.id as iduser FROM album_charts t, week w, user u WHERE u.id = w.iduser AND t.idweek = w.id AND t.album = '".addslashes($album["name"])."' AND t.artist = '".addslashes($album["artist"])."' GROUP BY u.id ORDER BY total DESC");
			$totalusers = 0;
			$totaln1 = 0;
			$totalcharts = count($totalcharts);

			$topusers = array();
			$i = 0;

			foreach ($usersdata as $value) {
				$totalusers++;
				$totaln1 += $value->total;
				if($i < 5)
				{
					$topusers[$i]["user"] = $this->factory->findOneBy("B7KP\Entity\User", $value->iduser);
					$topusers[$i]["weeks"] = $value->total;
					$topusers[$i]["avatar"] = $lastfm->getUserInfo(array('user' => $topusers[$i]["user"]->login));
					$topusers[$i]["avatar"] = str_replace("34s", "avatar170s", $topusers[$i]["avatar"]["image"]);
				}
			}
			$imgbg = $this->getBgImage($album);
			$img = (isset($album["images"]["large"]) ? $album["images"]["large"] : $imgbg);
			$lfmurl = $album["url"];
			$name = $album["name"];
			$artist = $album["artist"];
			$listeners = $album["listeners"];
			$playcount = $album["playcount"];
			$userplaycount = $album["userplaycount"];
			$vars = array(
							"lfm_bg" 		=> $imgbg, 
							"lfm_image" 	=> $img, 
							"lfmurl"		=> $lfmurl, 
							"listeners" 	=> $listeners, 
							"playcount" 	=> $playcount, 
							"user" 			=> $this->user, 
							"userplaycount" => $userplaycount, 
							"name" 			=> $name, 
							"totalusers"	=> $totalusers, 
							"totaln1" 		=> $totaln1,
							"totalcharts"	=> $totalcharts,
							"topusers" 		=> $topusers,
							"artist" 		=> $artist,
							"artisturl"		=> Route::url("artist", array('name' => F::fixLFM($artist)))
						);
			$this->render("album.php", $vars);
		}
		else
		{
			$this->redirectToRoute("registernotfound", array("entity" => "album"));
		}
	}

	protected function getBgImage($album)
	{
		$img = null;
		if(isset($album["images"]))
		{
			if(isset($album["images"]["mega"]))
			{
				$img = $album["images"]["mega"];
			}
			else
			{
				if(isset($album["images"]["extralarge"]))
				{
					$img = $album["images"]["extralarge"];
				}
				else
				{
					if(isset($album["images"]["large"]))
					{
						$img = $album["images"]["large"];
					}
					else
					{
						if(isset($album["images"]["medium"]))
						{
							$img = $album["images"]["medium"];
						}
					}
				}
			}
		}

		return $img;
	}

	protected function checkAccess()
	{
		$this->user = UserSession::getUser($this->factory);
	}

}
?>