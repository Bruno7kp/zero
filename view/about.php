<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "FAQ");
	$this->render("ext/head.php", $head);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php");?>
		<div id="fh5co-main">
			<?php 
			switch (Lang::getLangCode(Lang::getUserLang())) {
			 	case 'pt-BR':
			 		$this->render("inc/faq-pt.php");
			 		break;
			 	
			 	default:
			 		$this->render("inc/faq-en.php");
			 		break;
			 } 
			?>
			<?php $this->render("ext/footer.php");?>
		</div>
		<a href="#" class="btn btn-info fh5co-btn-icon" style="position: fixed; z-index: 10000; bottom: 0; right:3%;"><i class="fa fa-chevron-up"></i></a>
	</body>
</html>