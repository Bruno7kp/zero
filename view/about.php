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
			<section>
				<div class="container">
					<div class="row">

						<div class="fh5co-spacer fh5co-spacer-sm"></div>	
						<div class="col-md-8 col-md-offset-2 text-center">
						<h1>FAQ</h1>
						<h3>
							O que é?
						</h3>
						<p class="text-muted">
							Um lugar para os fanáticos por músicas e charts terem sua própria HOT 100.
						</p>

						<h3>
							O que é preciso para poder usá-lo?
						</h3>
						<p class="text-muted">
							Uma conta no Last.fm para rastrear seus hábitos musicais.
						</p>

						<h3>
							Já tenho uma conta na Last.fm. E agora?
						</h3>
						<p class="text-muted">
							Aperto no menu 'Login', na página de login haverá um link para você se registrar. Apertando nele você irá para uma página onde será solicitado para 'se conectar' com o Last.fm, clicando nele você será redirecionado para o site do Last.fm onde o mesmo vai perguntar para você dar a permissão de acessar sua conta. Aceitando o pedido, você será redirecionado de volta para o site, onde irá inserir mais alguns dados para concluir seu cadastro.
						</p>

						<h3>
							Já me cadastrei. Cadê os charts?
						</h3>
						<p class="text-muted">
							Após realizar o cadastro, você poderá ver sua página de perfil, nela deve aparecer uma mensagem avisando que há semanas desatualizadas, clicando no link presente na mesma, você irá para a página de atualização, nela há duas opções, 'atualizar tudo' e 'atualizar novas semanas', na primeira atualização não irá fazer nenhuma diferença entre as duas, mas caso já tenha atualizado seus charts antes, não é necessário que você atualize todas as semanas novamente. Mas ATENÇÃO: antes de atualizar seus chart, vá para a página de configurações, lá você poderá escolher se seus charts vão ser um top 5, top 10, top 20, etc, caso não atualize suas configurações, o chart gerado será o padrão: top 10.
						</p>

						<h3>
							É preciso atualizar todo o meu chart novamente caso eu mude alguma configuração?
						</h3>
						<p class="text-muted">
							Depende. As alterações de personalização de chart não precisam de atualização, já as de limite de itens (top5 / top 10 / etc) podem precisar, por exemplo, se você tinha atualizado seus chart como top 10 e depois mudou para top 5, sem problemas, agora, se for alterado de top 10 para top 20, aí sim será necessário a atualização de todas as semanas, já que apenas os 10 primeiros estão salvos nas semanas que já foram atualizadas anteriormente.
						</p>

						<h3>
							Exclui uma reprodução/música/álbum/artista do meu Last.fm, como faço para afetar os charts semanais também?
						</h3>
						<p class="text-muted">
							Você pode 'atualizar tudo' que pegará os dados novamente mas sem a presença do item que você excluiu, ou caso você tenha excluído apenas scrobbles que afetam uma única semana, é possível ir até a página da semana em questão e no fim da tabela, apertar em 'atualizar chart', que atualizará apenas aquela semana.
						</p>

						<h3>
							Qual é o início / fim da 'contagem' das reproduções para os chart semanais?
						</h3>
						<p class="text-muted">
						A data de início e fim da 'contagem' é domingo às 00:00 horário GMT (21:00h de sábado no horário de Brasília)
						</p>
						<h3>
							Ok, domingo chegou, o que faço pra atualizar o novo chart?
						</h3>
						<p class="text-muted">
							A atualização da nova semana só vai ser possível após às 12:00 GMT (09:00h hor. de Brasília) de domingo, ao entrar na sua página de perfil logado, uma mensagem vai avisar que você tem uma semana desatualizada, vá para a página de atualizações e aperte em 'atualizar novas semanas' e pronto.
						</p>

						<h1>Outros 'detalhes'</h1>
						<p class="text-muted">
							Sobre o "copiar chart": tenha em mente que nem todos os lugares suportam a colagem com formatação, caso contrário a colagem deve sair toda quebrada.
							<br/>
							<br/>
							Sobre as imagens: Todas as imagens são do last.fm.
							<br/>
							<br/>
							Sobre as imagens das músicas serem do artista e não do álbum: É possível buscar a capa do álbum em que a música pertence, porém, a grande maioria das vezes, principalmente com músicas novas, o Last.fm ou retorna o álbum incorreto ou não retorna nada, por esse motivo as imagens das músicas são dos artistas, que é garantido que vai ter algo.
							<br/>
							<br/>
							Sobre a possibilidade de ter um 'álbuns com mais músicas em #1 / top 5 etc...', idem as imagens, a relação entre as músicas e álbuns no last.fm é bem fraca atualmente, por isso fica inviável fazer isso por enquanto.
							<br/>
							<br/>
							Sobre os nomes ZoADoS das músicas do álbum da Ellie Goulding: não há nada que eu possa fazer, continuem xingando o Last.fm
							<br/>
							<br/>
							Último mas não menos importante, note que caso o last.fm ou você mesmo altere o nome de uma música/álbum, seja um acento, um espaço ou qualquer coisa, o sistema tem grandes chances de entender como uma música nova. Então fique de olho, se isso ocorrer recomendo atualizar tudo, que aí a música virá escrita da mesma forma que atualmente. (Ps: mudanças de uppercase/lowercase não afetam, pois tanto o sistema quanto o last.fm são case insensitive, ou seja, não há diferença entre letras maiúsculas e minúsculas, ex: oN mY mIND, on my mind, ON MY MIND e On My Mind) 
						</p>
							
								<?php 
// 								require MAIN_DIR.'src/PHPMailer-master/PHPMailerAutoload.php';

// $mail = new PHPMailer;

// //$mail->SMTPDebug = 3;                               // Enable verbose debug output

// $mail->isSMTP();  
// $mail->CharSet = 'UTF-8';                                    // Set mailer to use SMTP
// $mail->Host = 'smtp.live.com';  // Specify main and backup SMTP servers
// $mail->SMTPAuth = true;                               // Enable SMTP authentication
// $mail->Username = 'bruno7kp@outlook.com';                 // SMTP username
// $mail->Password = '';                           // SMTP password
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

						</div>
						<div class="fh5co-spacer fh5co-spacer-md"></div>	

					</div>
					
				</div>
			</section>
			<?php $this->render("ext/footer.php");?>
		</div>
	</body>
</html>