<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Utils\UserSession;
use B7KP\Utils\Snippets;
use B7KP\Entity\User;
use B7KP\Utils\Functions as F;
use B7KP\Library\Route;
use B7KP\Library\Lang;
use LastFmApi\Main\LastFm;

class MusicController extends Controller
{
	protected $user;
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=music|route=/music/{artist}/_/{name})
	*/
	public function musicMainPage($artist, $name)
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

		$music = $lastfm->getMusicInfo($name, $artist);
		if(is_array($music))
		{
			$usersdata = $dao->run("SELECT count(t.id) as total, u.id as iduser FROM music_charts t, week w, user u WHERE u.id = w.iduser AND t.idweek = w.id AND t.music = '".addslashes($music["name"])."' AND t.artist = '".addslashes($music["artist"]["name"])."' AND t.rank = 1 GROUP BY u.id ORDER BY total DESC");
			$totalcharts = $dao->run("SELECT count(t.id) as total, u.id as iduser FROM music_charts t, week w, user u WHERE u.id = w.iduser AND t.idweek = w.id AND t.music = '".addslashes($music["name"])."' AND t.artist = '".addslashes($music["artist"]["name"])."' GROUP BY u.id ORDER BY total DESC");
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
			$artist = $music["artist"]["name"];
			$imgbg = $this->getBgImage($music, $artist);
			$img = (!empty($music["album"]["image"]["large"]) ? $music["album"]["image"]["large"] : $imgbg[1]);
			$imgbg = is_array($imgbg) ? $imgbg[0] : $imgbg;
			$lfmurl = $music["url"];
			$name = $music["name"];
			$listeners = $music["listeners"];
			$playcount = $music["playcount"];
			$userplaycount = $music["userplaycount"];
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
			$this->render("music.php", $vars);
		}
		else
		{
			$this->redirectToRoute("registernotfound", array("entity" => "music"));
		}
	}

	protected function getBgImage($music, $artist)
	{
		$img = null;
		if(isset($music["album"]["image"]))
		{
			if(isset($music["album"]["image"]["mega"]))
			{
				$img = $music["album"]["image"]["mega"];
			}
			else
			{
				if(isset($music["album"]["image"]["extralarge"]))
				{
					$img = $music["album"]["image"]["extralarge"];
				}
				else
				{
					if(isset($music["album"]["image"]["large"]))
					{
						$img = $music["album"]["image"]["large"];
					}
					else
					{
						if(isset($music["album"]["image"]["medium"]))
						{
							$img = $music["album"]["image"]["medium"];
						}
					}
				}
			}
		}

		if(empty($img))
		{
			$lfm = new LastFm();
			$artist = $lfm->getArtistInfo($artist);
			$img[0] = $artist["images"]["mega"];
			$img[1] = $artist["images"]["large"];
		}

		return $img;
	}

	protected function checkAccess()
	{
		$this->user = UserSession::getUser($this->factory);
	}

}
?>