<?php
namespace B7KP\Entity;

class Settings extends Entity
{
	/**
	* @Assert(null=false|int)
	*/
	protected $iduser;

	/**
	* @Assert(null=false|int)
	* @Options(values={"10": "Default - Top 10","5": "Top 5", "15": "Top 15", "20": "Top 20", "25": "Top 25", "30": "Top 30", "40": "Top 40", "50": "Top 50", "100": "Top 100", "1": "Max"})
	*/
	protected $art_limit;

	/**
	* @Assert(null=false|int)
	* @Options(values={"10": "Default - Top 10","5": "Top 5", "15": "Top 15", "20": "Top 20", "25": "Top 25", "30": "Top 30", "40": "Top 40", "50": "Top 50", "75": "Top 75", "100": "Top 100", "1": "Max"})
	*/
	protected $alb_limit;

	/**
	* @Assert(null=false|int)
	* @Options(values={"10": "Default - Top 10","5": "Top 5", "15": "Top 15", "20": "Top 20", "25": "Top 25", "30": "Top 30", "40": "Top 40", "50": "Top 50", "75": "Top 75", "100": "Top 100", "1": "Max"})
	*/
	protected $mus_limit;

	function __construct()
	{
		parent::__construct();
	}
}
?>