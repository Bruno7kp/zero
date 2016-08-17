<?php
namespace B7KP\Entity;

class Friend extends Entity
{
	/**
	* @Assert(null=false|int)
	*/
	protected $iduser_one;

	/**
	* @Assert(null=false|int)
	*/
	protected $iduser_two;

	/**
	* @Assert(null=false|int)
	*/
	protected $accepted;

	/**
	* @Assert(null=false|int)
	*/
	protected $notified;

	function __construct()
	{
		parent::__construct();
	}

	public function accept()
	{
		$this->accepted = 1;
	}

	public function notified()
	{
		$this->notified = 1;
	}
}
?>