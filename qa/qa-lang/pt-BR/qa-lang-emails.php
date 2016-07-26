<?php
	
/*
	Question2Answer (c) Gideon Greenspan

	http://www.question2answer.org/

	
	File: qa-include/qa-lang-emails.php
	Version: See define()s at top of qa-include/qa-base.php
	Description: Language phrases for email notifications


	This program is free software; you can redistribute it and/or
	modify it under the terms of the GNU General Public License
	as published by the Free Software Foundation; either version 2
	of the License, or (at your option) any later version.
	
	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	More about this license: http://www.question2answer.org/license.php
*/

	return array(
		'a_commented_body' => "Sua resposta em ^site_title recebeu um comentário de ^c_handle:\n\n^open^c_content^close\n\nSua resposta era:\n\n^open^c_context^close\n\nReplique com o seu próprio comentário:\n\n^url\n\nAtenciosamente,\n\n^site_title",
		'a_commented_subject' => 'Sua resposta em ^site_title recebeu um novo comentário',

		'a_followed_body' => "Sua resposta em ^site_title tem uma nova pergunta relacionada feita por ^q_handle:\n\n^open^q_title^close\n\nSua resposta é:\n\n^open^a_content^close\n\nClique abaixo para conferir a nova pergunta:\n\n^url\n\nAtenciosamente,\n\n^site_title",
		'a_followed_subject' => 'Sua resposta em ^site_title tem uma pergunta relacionada',

		'a_selected_body' => "Parabéns! Sua resposta em ^site_title foi escolhida como a melhor por ^s_handle:\n\n^open^a_content^close\n\nA pergunta é:\n\n^open^q_title^close\n\nConfira novamente a sua resposta:\n\n^url\n\nAtenciosamente,\n\n^site_title",
		'a_selected_subject' => 'Sua resposta em ^site_title foi escolhida!',

		'c_commented_body' => "Um novo comentário por ^c_handle foi feito após o seu em ^site_title:\n\n^open^c_content^close\n\nA discussão é a seguinte:\n\n^open^c_context^close\n\nÉ possível responder com um novo comentário:\n\n^url\n\nAtenciosamente,\n\n^site_title",
		'c_commented_subject' => 'Seu comentário em ^site_title recebeu uma resposta',

		'confirm_body' => "Clique abaixo para confirmar o seu email no site ^site_title.\n\n^url\n\nAtenciosamente,\n^site_title",
		'confirm_subject' => '^site_title - Email Confirmado',

		'feedback_body' => "Comentários:\n^message\n\nName:\n^name\n\nEmail:\n^email\n\nPágina Anterior:\n^previous\n\nUsuário:\n^url\n\nEndereço IP:\n^ip\n\nNavegador:\n^browser",
		'feedback_subject' => '^ feedback',

		'flagged_body' => "Uma publicação de ^p_handle recebeu ^flags:\n\n^open^p_context^close\n\nConfira a publicação:\n\n^url\n\n\nConfira todas as publicações denunciadas:\n\n^a_url\n\nAtenciosamente,\n\n^site_title",
		'flagged_subject' => '^site_title tem uma nova denúncia',

		'moderate_body' => "Uma publicação de ^p_handle aguarda a sua aprovação:\n\n^open^p_context^close\n\nClique abaixo para aprovar ou rejeitar:\n\n^url\n\n\nConfira todas publicações que aguardam aprovação:\n\n^a_url\n\nAtenciosamente,\n\n^site_title",
		'moderate_subject' => '^site_title moderação',

		'new_password_body' => "Sua senha para o site ^site_title é a que segue.\n\nPassword: ^password\n\nÉ recomendada a mudança imediata por segurança.\n\nAtenciosamente,\n^site_title\n^url",
		'new_password_subject' => '^site_title - Sua Nova Senha',

		'private_message_body' => "Você recebeu uma mensagem privada de ^f_handle em ^site_title:\n\n^open^message^close\n\n^moreAtenciosamente,\n\n^site_title\n\n\nPara bloquear mensagens privadas, visite a página de sua conta:\n^a_url",
		'private_message_info' => "Mais informações sobre ^f_handle:\n\n^url\n\n",
		'private_message_reply' => "Clique abaixo para responder ^f_handle por mensagem privada:\n\n^url\n\n",
		'private_message_subject' => 'Mensagem privada de ^f_handle em ^site_title',

		'q_answered_body' => "Sua pergunta em ^site_title foi respondida por ^a_handle:\n\n^open^a_content^close\n\nSua pergunta foi:\n\n^open^q_title^close\n\nSe gostar da resposta, você pode escolhê-la como a melhor:\n\n^url\n\nAtenciosamente,\n\n^site_title",
		'q_answered_subject' => 'Sua pergunta em ^site_title foi respondida',

		'q_commented_body' => "Sua pergutna em ^site_title tem um novo comentário de ^c_handle:\n\n^open^c_content^close\n\nSua pergunta foi:\n\n^open^c_context^close\n\nVocê pode respondê-lo com um novo comentário:\n\n^url\n\nAtenciosamente,\n\n^site_title",
		'q_commented_subject' => 'Sua pergunta em ^site_title tem um novo comentário',
		'q_posted_body' => "Uma nova pergutna foi feita por ^q_handle:\n\n^open^q_title\n\n^q_content^close\n\nClique abaixo para ver a pergunta:\n\n^url\n\nAtenciosamente,\n\n^site_title",
		'q_posted_subject' => '^site_title tem uma nova pergunta',
		
		'remoderate_body' => "Uma edição de ^p_handle exige a sua reaprovação:\n\n^open^p_context^close\n\nClique abaixo para aprovar ou ocultar a edição:\n\n^url\n\n\nConfira todas as publicações que aguardam aprovação:\n\n^a_url\n\n\nThank you,\n\n^site_title",
		'remoderate_subject' => '^site_title moderação',

		'reset_body' => "Clique abaixo para restaurar sua senha em ^site_title.\n\n^url\n\nTambém é possível inserir o código abaixo no campo designado.\n\nCode: ^code\n\nSe você não pediu a restauração de sua senha, ignore esta mensagem.\n\nAtenciosamente,\n^site_title",
		'reset_subject' => '^site_title - Restauração de Senha Esquecida',

		'to_handle_prefix' => "^,\n\n",
		
		'u_registered_body' => "Um novo usuário se registrou como ^u_handle.\n\nClique abaixo para conferir o perfil dele:\n\n^url\n\nAtenciosamente,\n\n^site_title",
		'u_to_approve_body' => "Um novo usuário se registrou como ^u_handle.\n\nClique abaixo para aprová-lo:\n\n^url\n\nConfira todos os usuários que aguardam aprovação:\n\n^a_url\n\nAtenciosamente,\n\n^site_title",
		'u_registered_subject' => '^site_title tem um novo usuário!',
		
		'u_approved_body' => "Você pode ver o seu novo perfil aqui:\n\n^url\n\nAtenciosamente,\n\n^site_title",
		'u_approved_subject' => 'Você foi aprovado no ^site_title. Seja bem vindo!',
		
		'wall_post_subject' => 'Publicar no mural de ^site_title',
		'wall_post_body' => "^f_handle publicou no seu mural em ^site_title:\n\n^open^post^close\n\nClique abaixo para responder:\n\n^url\n\nAtenciosamente,\n\n^site_title",

		'welcome_body' => "Obrigado por se cadastrar em ^site_title.\n\n^custom^confirmSeus dados de login são:\n\nUsuário: ^handle\nEmail: ^email\n\nMantenha essa informação segura.\n\nAtenciosamente,\n\n^site_title\n^url",
		'welcome_confirm' => "Clique abaixo para confirmar o seu email.\n\n^url\n\n",
		'welcome_subject' => 'Seja bem vindo a ^site_title!',
	);
	

/*
	Omit PHP closing tag to help avoid accidental output
*/