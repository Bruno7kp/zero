<?php
use B7KP\Library\Route;
use B7KP\Library\Lang;
?>
<section>
    <div class="container">
        <div class="row" id="intro">
            <div class="fh5co-spacer fh5co-spacer-sm"></div>
            <div class="col-md-2 col-sm-4" id="fh5co-sidebar">
                <div class="fh5co-side-section fh5co-nav-links">
                    <h2 class="fh5co-uppercase-heading-sm">FAQ</h2>
                    <ul>
                        <li><a href="#intro">O que é?</a></li>
                        <li><a href="#lastfm">Last.fm</a></li>
                        <li>
                            <a href="#acc">Conta</a>
                            <ul>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#acc"><small>Cadastro</small></a></li>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#login"><small>Login</small></a></li>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#forgotpass"><small>Recuperar conta</small></a></li>
                            </ul>
                        </li>
                        <li>
                            <a href="#charts">Charts</a>
                            <ul>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#charts"><small>Gerando os charts</small></a></li>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#chartconfig"><small>Configuração</small></a></li>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#chartupdate"><small>Datas/horários do charts</small></a></li>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#chartedit"><small>Edição de charts</small></a></li>
                            </ul>
                        </li>
                        <li>
                            <a href="#curiosities">Curiosidades</a>
                            <ul>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#curiosities"><small>Estatísticas</small></a></li>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#livechart"><small>Live Chart</small></a></li>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#chartpoints"><small>Pontos</small></a></li>
                            </ul>
                        </li>
                        <li>
                            <a href="#certified">Certificados</a>
                            <ul>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#certified"><small>Configuração</small></a></li>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#plaque"><small>Placas</small></a></li>
                            </ul>
                        </li>
                        <li>
                            <a href="#info">Outras informações</a>
                            <ul>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#tips"><small>Dicas</small></a></li>
                                <li class="no-margin">&nbsp;&nbsp;<a href="#limitations"><small>Limitações</small></a></li>
                            </ul>
                        </li>


                    </ul>
                </div>
            </div>
            <div class="col-md-10 col-sm-8 text-justify" id="fh5co-content">
                <h2>O que é?</h2>
                <!-- <img src="http://i.imgur.com/OOKNwlp.png" alt="Logo" class="fh5co-align-left img-responsive max-w-100"> -->
                <p>Um lugar para os fanáticos por músicas e charts terem sua própria "HOT 100".<br/>
                    Com o ZERO você pode gerar charts semanais das músicas que você mais escuta baseado no seu Last.fm. Além disso, você também poderá acessar curiosidades de seus charts e criar 'certificados' para músicas e álbuns. Veja essas e outras ferramentas nas seções a seguir.</p>
                <h2 id="lastfm">Last.fm</h2>
                <p>Para usufruir do ZERO, é necessário que você tenha uma conta no Last.fm, uma "rede social musical", onde você pode acompanhar os artistas e músicas que você mais escuta, para saber mais como o Last.fm funciona, acesse os seguintes links: <a href="http://www.last.fm/about" target="_blank">last.fm/about</a> - <a href="http://www.last.fm/download" target="_blank">last.fm/download</a></p>

                <h2 id="acc">Conta</h2>
                <h3 >Cadastro</h3>
                <p>Para realizar o cadastro, acesse <a href="<?php echo Route::url("register");?>" target="_blank">esta página</a>, conecte o ZERO com o seu last.fm, apertando no botão "clique aqui". Após isso você será redirecionado para o site do Last.fm, onde você deverá autorizar o acesso do ZERO na sua conta. Depois disso, você será redirecionado novamente para a página de cadastro. Para finalizar o cadastro, preencha os campos de email e senha, e aperte o botão "enviar", em caso de sucesso, sua conta será criada e você será redirecionado para a página inicial do ZERO. Note que a senha e o email <b>não</b> precisam ser os mesmos da sua conta no Last.fm.</p>

                <h3 id="login">Login</h3>
                <p>O acesso a sua conta pode ser feito na página de <a href="<?php echo Route::url("login");?>">login</a>, nela você deve colocar seu <b>nome de usuário</b> e <b>senha</b>.</p>

                <h3 id="forgotpass">Recuperar conta</h3>
                <p>Esqueceu a senha? Você pode recuperar acessando <a href="<?php echo Route::url("forgotpass");?>" target="_blank">esta página</a>. Ela funciona da mesma forma que o cadastro, primeiro deverá ser preenchido seu nome de usuário, após isso, será preciso a confirmação de que a conta é sua, você será redirecionado para a página do last.fm para confirmar, e voltará para inserir sua nova senha.</p>

                <h2 id="charts">Charts</h2>
                <h3>Gerando os charts</h3>
                <p>Após entrar em sua conta, já é possível gerar seus charts semanais, para isso acesse <a href="<?php echo Route::url('update');?>">esta página</a>, nela, haverá dois botões, o "atualizar tudo" e o "atualizar novas semanas".
                    Ao atualizar tudo, será gerado o chart para todas as semanas a partir da data de cadastro do seu Last.fm, ao atualizar novas semanas, será verificado qual a última semana atualizada do seu chart e então serão gerados os charts das semanas posteriores a ela. Na primeira vez que é feita a atualização dos charts não haverá diferença em utilizar um ou outro.</p>
                <h3 id="chartconfig">Configuração dos charts</h3>
                <p>Nas <a href="<?php echo Route::url('settings');?>">configurações</a> do site, você pode optar pelo seu chart ser Top 10, Top 20, etc. Note que, caso altere esse valor, talvez seja necessário "atualizar tudo" para que ele tenha efeito, por exemplo, se você tinha atualizado seus charts como top 10 e depois mudou para top 5, sem problemas, agora, se for alterado de top 10 para top 20, aí sim será necessário a atualização de todas as semanas, já que apenas os 10 primeiros estão salvos nas semanas que já foram atualizadas anteriormente.</p>
                <p>O "atualizar tudo" recadastra as semanas que já foram geradas, ou seja, se por algum motivo você excluir algum artista da sua conta no Last.fm que esteja presente nos charts, você pode utilizar o "atualizar tudo" e então este artista não aparecerá mais. Caso precise atualizar uma única semana já cadastrada ao invés de todas, também é possível utilizar o "atualizar chart", botão que fica logo abaixo da tabela do seu chart semanal.</p>
                <p>Você poderá ver uma lista de todas os chart semanais geradas, acessando no menu "Charts" e depois indo em "ver lista completa" logo abaixo da lista de últimos #1s.</p>

                <h3 id="chartupdate">Datas/horários dos charts</h3>
                <p>Os charts semanais começam (e terminam) todo <span id="timeWeUtc" class="bold"></span> no horário GMT (ou <span id="timeWeLocal"  class="bold"></span> no seu fuso horário local [<span class="timeZone"></span>]) <b>ou</b> toda  <span id="timeNuUtc" class="bold"></span> no horário GMT (ou <span id="timeNuLocal"  class="bold"></span> no seu fuso horário local [<span class="timeZone"></span>]). A atualização das novas semanas é feita da mesma forma que a primeira atualização, ao entrar na sua página de perfil haverá um aviso de que existe uma nova semana para atualizar, basta ir na página de atualização e apertar o botão "atualizar novas semanas" e a nova semana será gerada. A atualização ficará disponível logo após o encerramento da semana.</p>
                <p>Faltam <span class="bold" id="timeToWE"></span> horas para a atualização de quem usa Domingo como início da contagem chegar e <span id="timeToNU"  class="bold"></span> horas para a próxima atualização de quem prefere a Sexta ficar disponível.</p>

                <h3 id="chartedit">Edição de charts</h3>
                <p>Em casos de empates no número de reproduções, é possível editar as posições da forma que você achar mais justa, para isso, abra a página do chart semanal onde o empate ocorre e aperte em 'editar chart', depois arraste o itens na ordem que desejar e salve.</p>

                <h2 id="curiosities">Curiosidades</h2>
                <h3>Estatísticas</h3>
                <p>A página principal de charts, acessada pelo menu, mostra os últimos #1s de seus charts e algumas estatísticas baseadas nos seus charts semanais como: maior número de reproduções em uma semana, maiores estreias, etc, algumas dessas página possuem um filtro de posições, onde você pode, por exemplo, ver o maior número de reproduções em uma semana para uma música fora do top 10 (selecionando ">" e "10") ou em uma posição específica, como #2 (selecionando "=" e "2").</p>
                <h3 id="livechart">Live Chart</h3>
                <p>O Live Chart é uma prévia de como está o chart da semana atual, ele só fica disponível se você já tiver ao menos uma semana gerada e se seus charts estiverem atualizados. Como a utilização do Live Chart pode levar os usuários a "manipularem" o chart, é possível, caso queira, esconder o mesmo, indo nas suas <a href="<?php echo Route::url('settings');?>">configurações</a>.</p>
                <h3 id="chartpoints">Pontos</h3>
                <p>Os pontos (ou "chart points") são feitos baseados na estabilidade dos artistas/álbuns/músicas durante as semanas, o cálculo é feito da seguinte forma: é pego o chart-run (posições semana por semana que o artista/álbum/música passou), depois é atribuido um valor para cada posição, e por fim esses valores são somados, os pontos para cada posição podem serem vistos a seguir: </p>
                <p class="col-5-div jumbotron">
                    <?php
                    for ($i=1; $i <= 50; $i++) {
                        echo "#".str_pad($i, 2, 0, STR_PAD_LEFT)." = ".str_pad((100-(($i-1)*2)), 3, 0, STR_PAD_LEFT)."<br/>";
                    }
                    ?>
                </p>
                <p>
                    Também pode-se utilizar da seguinte fórmula para fazer o cálculo:
                    <code>P = (W*100) - ((S-W)*2)</code> sendo, P = pontos, W = total de semanas no chart, S = soma das posições.
                    <br/>Exemplo: uma música X tem o seguinte desempenho: 7 - 2 - 1 - 1, substituindo por pontos: 88 + 98 + 100 + 100 = 386 pontos, utilizando a fórmula: (4*100) - ((11-4)*2) = 400 - 14 = 386.
                </p>
                <h2 id="certified">Certificados</h2>
                <p>Assim como na indústria fonográfica, no ZERO é possível "certificar" músicas e álbuns, veja a seguir como configurar.</p>
                <h3>Configuração</h3>
                <p>Acesse a página de <a href="<?php echo Route::url('settings');?>">configurações</a> e no fim da mesma terá um botão que o levará para a <a href="<?php echo Route::url('cert_settings');?>">configuração de certificados</a>, nela você pode habilitar os certificados e adicionar os valores que desejar para os certificados de Ouro, Platina e Diamante. Você pode escolher se as certificações serão baseados no número de reproduções, no número de <a href="#chartpoints">pontos</a> ou na soma de ambos.</p>
                <p>Habilitando os certificados, será possível vê-los na página do álbum/música.</p>
                <p>Caso utilize a soma de pontos e reproduções, você poderá definir pesos que cada um terá. É possível escolher valores de 0,01 até 10.000 como multiplicadores das reproduções e pontos de álbuns e músicas.</p>
                <p>Assim você poderá dar um peso maior para as reproduções, por exemplo:</p>
                <p>Reproduções tem peso 10, enquanto pontos tem peso 1, assim, um álbum com 250 reproduções e 700 pontos terá um total de 2.500 + 700 pontos no total, ou 3.200 pontos, ao invés dos 950 que teria caso ambos tivessem peso 1.</p>
                <h3 id="plaque">Placas</h3>
                <p>Você também pode gerar placas de certificado, para isso, habilite as placas na página de <a href="<?php echo Route::url('cert_settings');?>">configuração de certificados</a>, e depois acesse a página do álbum/música, no fim da página aparecerá um botão "gerar placa de certificado", aperte nele e aguarde alguns segundos, quando a placa ficar pronta ela irá aparecer na sua tela. Caso o álbum/música já tenha alguma placa gerada, você poderá visualizar a mesma acessando a página do respectivo álbum/música, onde aparecerá um novo botão "placas de certificados".</p>
                <h2 id="info">Outras informações</h2>
                <h3 id="tips">Dicas</h3>
                <p>Nas tabelas dos charts semanais, existe um ícone ao lado esquerdo de cada posição <a class="cr-icon"><i class="ti-stats-up"></i></a>, ao pressionar o mesmo, será mostrado o desempenho (chart-run) do artista/álbum/música em questão.</p>
                <p>Nele, há um ícone que altera a forma em que o chart-run é mostrado <a class="switchto" style="font-size: smaller;"><i class="ti-layout-grid2"></i></a>, em blocos, ou apenas texto.<br/>
                    Ex:<br/>
                    <img src="http://i.imgur.com/xnuMBnx.giff" alt="">
                    <br/>
                    E na visualização por blocos, aos clicar nos blocos, será mostrado a semana e o número de reproduções.<br/>
                    Ex:<br/>
                    <img src="http://i.imgur.com/n3D2ypx.gif" alt="">
                </p>

                <h3 id="limitations">Limitações</h3>
                <p>Todos os dados do ZERO são providos pela API do Last.fm, infelizmente ela não disponibiliza ou disponibiliza apenas parcialmente algumas informações que seriam necessárias para a criação de algumas estatísticas e curiosidades muito requisitadas pelos usuários. Aqui vai uma lista de itens que não vão poder ser implementados ou vão ficar "limitados", ao menos enquanto o Last.fm não melhorar a API:</p>
                <ul>
                    <li>Na página do artista, só é possível mostrar as músicas/álbuns que entraram no chart</li>
                    <li>Na página do álbum, não é possível mostrar as faixas do mesmo</li>
                    <li>Nos charts e na página de música, irá ser mostrado a foto do artista e não a foto do álbum em que a música pertence</li>
                    <li>A lista de artistas com mais certificados só é visível e funcional para quem utilizar <b>pontos</b></li>
                    <li>A lista de certificados semanais mostrará o certificado conquistado até aquela semana para quem utilizar <b>pontos</b>, para os outros usuários será mostrado o certificado conquistado até a <b>data atual</b>, independente de qual semana esteja visualizando.</li>
                </ul>
                <p>PS1: Cuidado com as tags, caso ocorra variação nelas, é muito provável que o sistema entenda que se tratam de artistas/álbuns/músicas diferentes.</p>
                <p>PS2: Você pode acompanhar as novidades de cada atualização do site <a href="<?php echo Route::url('zero_versions');?>">nesta página</a> (também acessível pelo número da versão no rodapé da página).</p>
            </div>
            <div class="fh5co-spacer fh5co-spacer-md"></div>
        </div>
    </div>
</section>