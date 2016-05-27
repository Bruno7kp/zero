<?php
namespace B7KP\Entity;

class Artist_charts extends Entity
{
	/**
	* @Assert(null=false|int)
	*/
	protected $idweek;

	/**
	* @Assert(null=false)
	*/
	protected $artist;

	/**
	* @Assert(null=false)
	*/
	protected $art_mbid;

	/**
	* @Assert(null=false|int|minNum=1)
	*/
	protected $playcount;

	/**
	* @Assert(null=false|int|minNum=1)
	*/
	protected $rank;

	/**
	* @Assert(null=false|int|min=14|max=14)
	*/
	protected $updated;

	function __construct()
	{
		parent::__construct();
	}
}
?>