<?php
use B7KP\Library\Route;
use B7KP\Library\Url;
use B7KP\Library\Lang;
use B7KP\Utils\UserSession;
?>
<!doctype html>
<html>
<?php
	$lang = substr($type, 0, 3)."_x";
	$title 	= $user->login." :: Top ".Lang::get($lang)." - YEC ".$year->year;
	$head 	= array("title" => $title);
	$this->render("ext/head.php", $head);
	$years = $this->factory->find("\B7KP\Entity\Yec", array("iduser" => $user->id), "year ASC");
	$last = end($years);
	$first = reset($years);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php", array("image" => $lfm_bg));?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row bottomspace-xxl text-center">
						<div class="col-xs-12">
							<?php 
							$this->render("inc/profile-menu.php", array('user' => $user, 'usericon' => $lfm_image));
							?>
						</div>
					</div>
					<div class="row">
						<div class="col-md-6 topspace-sm">
							<?php if($year->year > $first->year): ?> 
							<a class="btn btn-outline" href="<?php echo Route::url('yec_chart', array('login' => $user->login, 'type' => $type, 'year' => ($year->year - 1)));?>">
								<i class='ti-arrow-left'></i> 
								<span class="hidden-xs"><?php echo Lang::get('previous');?></span>
							</a>
							<?php ; endif;?>

							<div class="btn-group">
							  	<button type="button" class="btn btn-outline dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
							  		<span class="ti-calendar"></span>
  								</button>
  								<ul class="dropdown-menu min-165">
								    <?php 
								    $years = array_reverse($years);
								    $u = Url::getBaseUrl()."/user/".$user->login."/charts/".$type."/year/";
								    foreach ($years as $key => $value) {
								    	echo "<li><a href='".$u.$value->year."'>".$value->year."</a></li>";
								    }
								    ?>
  								</ul>
							</div>

							<?php if($last->year != $year->year): ?> 
							<a class="btn btn-outline" href="<?php echo Route::url('yec_chart', array('login' => $user->login, 'type' => $type, 'year' => ($year->year + 1)));?>">
								<span class="hidden-xs"><?php echo Lang::get('next');?> </span>
								<i class='ti-arrow-right'></i>
							</a>
							<?php ; endif;?>
						</div>
						<div class="col-md-6 text-right">
							<a class="btn btn-outline" href="<?php echo Route::url('yec_chart', array('login' => $user->login, 'type' => 'artist', 'year' => $year->year));?>"><i class='ti-user'></i></a>
							<a class="btn btn-outline" href="<?php echo Route::url('yec_chart', array('login' => $user->login, 'type' => 'album', 'year' => $year->year));?>"><i class='icon-vynil except'></i></a>
							<a class="btn btn-outline" href="<?php echo Route::url('yec_chart', array('login' => $user->login, 'type' => 'music', 'year' => $year->year));?>"><i class='ti-music'></i></a>
						</div>
					</div>
					<div class="row">
						<div id="copyme" class="col-md-12">
							<div class="text-center">
								<h2><?php echo $title?></h2>
								
								<?php echo $list;?>
							</div>
						</div>
						<div class="col-md-6 topspace-lg">
							<button class="btn btn-custom btn-info btn-sm" id="copy" data-clipboard-target="#copyme">
								<i class="ti-clipboard"></i> <span><?php echo Lang::get('copy');?> chart</span>
							</button>
						</div>
						<div class="col-md-6 topspace-lg">
							<div class="chart-table">
								<small>
									<span class="deb">NEW</span> = <?php echo Lang::get('new_def');?> | 
									<span class="ret">RE</span> = <?php echo Lang::get('re_def');?> | 
									<span>LW</span> = <?php echo Lang::get('lw_def');?>
								</small>
							</div>
						</div>
						<div class="col-md-12">
							<div id="disqus_thread"></div>
							<script>

							/**
							*  RECOMMENDED CONFIGURATION VARIABLES: EDIT AND UNCOMMENT THE SECTION BELOW TO INSERT DYNAMIC VALUES FROM YOUR PLATFORM OR CMS.
							*  LEARN WHY DEFINING THESE VARIABLES IS IMPORTANT: https://disqus.com/admin/universalcode/#configuration-variables*/
							/*
							var disqus_config = function () {
							this.page.url = PAGE_URL;  // Replace PAGE_URL with your page's canonical URL variable
							this.page.identifier = PAGE_IDENTIFIER; // Replace PAGE_IDENTIFIER with your page's unique identifier variable
							};
							*/
							(function() { // DON'T EDIT BELOW THIS LINE
							var d = document, s = d.createElement('script');
							s.src = '//zero-2.disqus.com/embed.js';
							s.setAttribute('data-timestamp', +new Date());
							(d.head || d.body).appendChild(s);
							})();
							</script>
							<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
						</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>	

					</div>
					
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>