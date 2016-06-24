<?php 
namespace B7KP\Utils;

use B7KP\Entity\User;
use B7KP\Entity\Settings;
use LastFmApi\Main\LastFm;

class Certified
{
	private $lastfm;
	private $user;
	private $settings;
	
	function __construct(User $user)
	{
		$this->user = $user;
		$this->lastfm = new LastFm();
		$this->lastfm->setUser($this->user->login);
		$this->settings = $this->factory->findOneBy("B7KP\Entity\Settings", $this->user->id, "iduser");
		$this->setValues();
	}

	private function setValues()
	{
		$this->album = new stdClass();
		$this->album->gold 		= $this->settings->alb_cert_gold;
		$this->album->platinum 	= $this->settings->alb_cert_platinum;
		$this->album->diamond 	= $this->settings->alb_cert_diamond;
		$this->music = new stdClass();
		$this->music->gold 		= $this->settings->mus_cert_gold;
		$this->music->platinum 	= $this->settings->mus_cert_platinum;
		$this->music->diamond 	= $this->settings->mus_cert_diamond;
	}

	
}
?>