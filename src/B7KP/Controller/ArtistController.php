<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
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

		if($this->user instanceof User)
		{
			$lastfm->setUser($this->user->login);
		}
		$name = urlencode($name);
		var_dump($name);

		$artist = $lastfm->getArtistInfo($name);
		if(is_array($artist))
		{
			$img = $this->getBgImage($artist);
			$lfmurl = $artist["url"];
			$name = $artist["name"];
			$listeners = $artist["stats"]["listeners"];
			$playcount = $artist["stats"]["playcount"];
			$userplaycount = $artist["stats"]["userplaycount"];
			$vars = array("lfm_image" => $img, "lfmurl" => $lfmurl, "listeners" => $listeners, "playcount" => $playcount, "user" => $this->user, "userplaycount", $userplaycount, "name" => $name);
			$this->render("artist.php", $vars);
		}
		else
		{
			//$this->redirectToRoute("registernotfound", array("entity" => "artist"));
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