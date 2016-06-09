<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Utils\UserSession;
use B7KP\Utils\Snippets;
use B7KP\Entity\User;
use B7KP\Library\Lang;
use LastFmApi\Main\LastFm;

class ArtistController extends Controller
{
	protected $user;
	
	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=artist|route=/music/{name})
	*/
	public function artistMainPage($name)
	{

		$this->checkAccess();
		$lastfm = new Lastfm();
		$dao = Dao::getConn();

		if($this->user instanceof User)
		{
			$lastfm->setUser($this->user->login);
		}

		$name = str_replace("+", " ", $name);
		$name = str_replace("%252b", "+", $name);

		$artist = $lastfm->getArtistInfo($name);
		if(is_array($artist))
		{
			$usersdata = $dao->run("SELECT count(t.id) as total, u.id as iduser FROM artist_charts t, week w, user u WHERE u.id = w.iduser AND t.idweek = w.id AND t.artist = '".addslashes($artist["name"])."' AND t.rank = 1 GROUP BY u.id ORDER BY total DESC");
			$totalcharts = $dao->run("SELECT count(t.id) as total, u.id as iduser FROM artist_charts t, week w, user u WHERE u.id = w.iduser AND t.idweek = w.id AND t.artist = '".addslashes($artist["name"])."' GROUP BY u.id ORDER BY total DESC");
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
			$imgbg = $this->getBgImage($artist);
			$img = (isset($artist["images"]["large"]) ? $artist["images"]["large"] : $imgbg);
			$lfmurl = $artist["url"];
			$name = $artist["name"];
			$listeners = $artist["stats"]["listeners"];
			$playcount = $artist["stats"]["playcount"];
			$userplaycount = $artist["userplaycount"];
			$similar = $artist["similar"];
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
							"similar"  		=> $similar
						);
			$this->render("artist.php", $vars);
		}
		else
		{
			$this->redirectToRoute("registernotfound", array("entity" => "artist"));
		}
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

	protected function checkAccess()
	{
		$this->user = UserSession::getUser($this->factory);
	}

}
?>