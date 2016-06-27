<?php
namespace B7KP\Entity;

class Plaque extends Entity
{
	/**
	* @Assert(null=false|int)
	*/
	protected $iduser;

	/**
	* @Assert(null=false|int)
	*/
	protected $type;

	/**
	* @Assert(null=false)
	*/
	protected $url;

	/**
	* @Assert(null=false)
	*/
	protected $name;

	/**
	* @Assert(null=false)
	*/
	protected $artist;

	/**
	* @Assert(null=false)
	*/
	protected $certified;

	/**
	* @Assert(null=false)
	*/
	protected $date;

	function __construct()
	{
		parent::__construct();
	}
}
?>