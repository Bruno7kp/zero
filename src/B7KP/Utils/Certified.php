<?php 
namespace B7KP\Utils;

use B7KP\Model\Model;
use B7KP\Entity\User;
use B7KP\Entity\Settings;
use B7KP\Library\Lang;
use LastFmApi\Main\LastFm;

class Certified
{
	private $lastfm;
	private $user;
	private $settings;
	private $album;
	private $music;
	
	function __construct(User $user, Model $factory)
	{
		$this->user = $user;
		$this->lastfm = new LastFm();
		$this->lastfm->setUser($this->user->login);
		$this->settings = $factory->findOneBy("B7KP\Entity\Settings", $this->user->id, "iduser");
		$this->setValues();
	}

	private function setValues()
	{
		$this->album = new \stdClass();
		$this->album->gold 		= $this->settings->alb_cert_gold;
		$this->album->platinum 	= $this->settings->alb_cert_platinum;
		$this->album->diamond 	= $this->settings->alb_cert_diamond;
		$this->music = new \stdClass();
		$this->music->gold 		= $this->settings->mus_cert_gold;
		$this->music->platinum 	= $this->settings->mus_cert_platinum;
		$this->music->diamond 	= $this->settings->mus_cert_diamond;
	}

	public function getPlaycount($type, $name, $artist)
	{
		$valid = array("album", "music");
		if(!in_array($type, $valid)): return null; endif;
		$fn 	= "get".strtoupper($type)."Info";
		$info 	= $this->lastfm->$fn($name, $artist);
		$plays 	= $info["userplaycount"];
		return $plays;
	}

	public function getCertification($type, $plays, $return = "default")
	{
		$valid = array("album", "music");
		if(!in_array($type, $valid)): return null; endif;

		$certification = $this->getDefaultCert($type, $plays);

		switch ($return) {
			case 'text':
				$text = "";
				if($certification['g'] > 0)
				{
					$text = Lang::get('gold');
				}
				else
				{
					if($certification['d'] > 0)
					{
						$text = $certification['d']."x ".Lang::get('diam');
					}
					if($certification['p'] > 0)
					{
						if($certification['d'] > 0)
						{
							$text .= " + ";
						}
						$text .= $certification['p']."x ".Lang::get('plat');
					}
				}
				$certification = empty($text) ? Lang::get('none') : $text;
				break;

			case 'class':
				# code...
				break;

			case 'icon':
				# code...
				break;
		}

		return $certification;
	}

	private function getDefaultCert($type, $plays)
	{
		$g = $this->$type->gold;
		$p = $this->$type->platinum;
		$d = $this->$type->diamond;
		$cert = array('g' => 0, 'p' => 0, 'd' => 0);
		if($g > 0)
		{
			if($plays >= $g && $plays < $p)
			{
				$cert['g'] = 1;
				return $cert;
			}
		}
		if($p > 0 && $plays >= $p)
		{
			if($d > 0 && $plays >= $d)
			{
				while ($plays >= $d) {
					$cert['d']++;
					$plays -= $d;
				}
			}
			$cert['p'] = floor($plays/$p);
		}

		return $cert;
	}

	
}
?>