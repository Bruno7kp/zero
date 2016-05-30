<?php 
namespace B7KP\Utils;

class Constants
{
	const SHOW_MOVE_HIDDEN 	= 0; // Not show chart moves
	const SHOW_MOVE_DIFF 	= 1; // Show chart moves (Ex: +1 / -2)
	const SHOW_MOVE_LW 		= 2; // Show last week pos (Ex: LW: 3 / LW: 9)
	const SHOW_MOVE_PERC 	= 3; // Show percentage move (points only) (Ex: LW: +41% / -50%)
	const LIMIT_MAX 		= 1; // Max of items in the chart, any other number, the number itself is the limit

	private function __construct(){}
}
?>