<?php
namespace B7KP\Entity;

class Yec extends Entity
{
	/**
	* @Assert(null=false|int)
	*/
	protected $iduser;

	/**
	* @Assert(null=false|int)
	*/
	protected $year;

	function __construct()
	{
		parent::__construct();
	}
}
?>