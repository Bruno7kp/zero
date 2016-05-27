<?php
namespace B7KP\Entity;

class Week extends Entity
{
	/**
	* @Assert(null=false|int)
	*/
	protected $iduser;

	/**
	* @Assert(null=false|int)
	*/
	protected $week;

	/**
	* @Assert(null=false)
	*/
	protected $from_day;

	/**
	* @Assert(null=false)
	*/
	protected $to_day;

	function __construct()
	{
		parent::__construct();
	}
}
?>