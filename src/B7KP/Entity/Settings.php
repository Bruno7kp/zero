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
	* @Options(values={"1": "Default - No Limit","5": "Top 5", "10": "Top 10", "15": "Top 15", "20": "Top 20", "25": "Top 25", "30": "Top 30", "40": "Top 40", "50": "Top 50", "75": "Top 75", "100": "Top 100"})
	*/
	protected $art_limit;

	/**
	* @Assert(null=false|int)
	* @Options(values={"1": "Default - No Limit","5": "Top 5", "10": "Top 10", "15": "Top 15", "20": "Top 20", "25": "Top 25", "30": "Top 30", "40": "Top 40", "50": "Top 50", "75": "Top 75", "100": "Top 100"})
	*/
	protected $alb_limit;

	/**
	* @Assert(null=false|int)
	* @Options(values={"1": "Default - No Limit","5": "Top 5", "10": "Top 10", "15": "Top 15", "20": "Top 20", "25": "Top 25", "30": "Top 30", "40": "Top 40", "50": "Top 50", "75": "Top 75", "100": "Top 100"})
	*/
	protected $mus_limit;

	function __construct()
	{
		parent::__construct();
	}
}
?>