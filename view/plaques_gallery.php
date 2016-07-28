<?php 
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => "{$user->login} - ".Lang::get("plaque"));
	$this->render("ext/head.php", $head);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("image" => $lfm_bg));?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-md">
						<div class="col-xs-12">
							<?php 
							$this->render("inc/profile-menu.php", array('user' => $user, 'usericon' => $lfm_image));
							?>
						</div>
					</div>
					<div class="row">
						<div class="col-xs-12">
							<div class="panel-group fh5co-accordion" id="accordion" role="tablist" aria-multiselectable="true">
								<?php
								foreach ($plaques as $key => $value) 
								{
								?>
							 	<div class="panel panel-default">
							    	<div class="panel-heading collapsed" role="tab" id="heading<?php echo md5($key);?>" data-toggle="collapse" data-parent="#accordion" data-target="#collapse<?php echo md5($key);?>" aria-expanded="false" aria-controls="collapse<?php echo md5($key);?>">
							      		<h4 class="panel-title">
							        		<a class="accordion-toggle">
							          			Cnon cupidatat skateboard dolor 
							        		</a>
							      		</h4>
							    	</div>
							    	<div id="collapse<?php echo md5($key);?>" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading<?php echo md5($key);?>" aria-expanded="false" style="height: 0px;">
							      		<div class="panel-body">
							        	Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo. Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS.
							      		</div>
							    	</div>
							 	</div>
								<?php
								}
								?>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	</body>
</html>