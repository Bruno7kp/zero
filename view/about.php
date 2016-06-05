<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
?>
<!doctype html>
<html>
<?php
	$head = array("title" => Lang::get('about'));
	$this->render("ext/head.php", $head);
?>
	<body class="inner-min">
		<?php $this->render("ext/menu.php");?>
		<?php $this->render("ext/header.php");?>
		<div id="fh5co-main">
			<section>
				<div class="container">
					<div class="row">

						<div class="fh5co-spacer fh5co-spacer-sm"></div>	
						<div class="col-md-4 col-md-offset-4 text-center">
							<h2><?php Lang::get('about');?></h2>
							Hey ~
							<hr>
							<h3>To do list</h3>
							<ul class="list-group">
								<li class="list-group-item">List of weeks/charts</li>
								<li class="list-group-item">New main bg</li>
								<li class="list-group-item">Artist page</li>
								<li class="list-group-item">Music page</li>
								<li class="list-group-item">Album page</li>
								<li class="list-group-item"><s>Change user password</s></li>
								<li class="list-group-item">Reset password</li>
								<?php 
// 								require MAIN_DIR.'src/PHPMailer-master/PHPMailerAutoload.php';

// $mail = new PHPMailer;

// //$mail->SMTPDebug = 3;                               // Enable verbose debug output

// $mail->isSMTP();  
// $mail->CharSet = 'UTF-8';                                    // Set mailer to use SMTP
// $mail->Host = 'smtp.live.com';  // Specify main and backup SMTP servers
// $mail->SMTPAuth = true;                               // Enable SMTP authentication
// $mail->Username = 'bruno7kp@outlook.com';                 // SMTP username
// $mail->Password = 'ab4m7g3p';                           // SMTP password
// $mail->SMTPSecure = 'tls';                            // Enable TLS encryption, `ssl` also accepted
// $mail->Port = 587;                                    // TCP port to connect to

// $mail->SetFrom('bruno@b7kp.tk', 'First Last', FALSE);
// $mail->addAddress('bruno@b7kp.tk', 'asd');     // Add a recipient

// $mail->isHTML(true);                                  // Set email format to HTML

// $mail->Subject = 'Here is the subject';
// $mail->Body    = 'This is the HTML message body <b>in bold!</b>';
// $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

// if(!$mail->send()) {
//     echo 'Message could not be sent.';
//     echo 'Mailer Error: ' . $mail->ErrorInfo;
// } else {
//     echo 'Message has been sent';
// }
								?>
							</ul>
						</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>	

					</div>
					
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>