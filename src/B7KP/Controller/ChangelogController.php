<?php
namespace B7KP\Controller;

use B7KP\Model\Model;
use B7KP\Core\Dao;
use B7KP\Core\App;
use B7KP\Entity\User;
use B7KP\Utils\UserSession;
use B7KP\Library\Route;
use B7KP\Library\Options;
use B7KP\Utils\Pass;

class ChangelogController extends Controller
{

	function __construct(Model $factory)
	{
		parent::__construct($factory);
	}

	/**
	* @Route(name=zero_versions|route=/changelog)
	*/
	public function showVersions()
	{
		$changes = array();
		$changes["0.11.000"] = array("18.07.2016","Novo FAQ", "Página de curiosidades do ZERO", "Página de changelog", "Opção para esconder o 'Live Chart'");
		$next = array("complete" => 0, "text" => array("Página para mostrar todas as placas já geradas", "Temas: Além do atual, haverá também uma versão 'dark' do site"));
		$vars = array("changes" => $changes, "next" => $next);
		$this->render("changelog.php", $vars);
	}

	protected function checkAccess()
	{
		return true;
	}
}
?>