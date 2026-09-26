**Portal do Credor — Case Administração Judicial**  
**Inventário funcional do sistema**  
***Objetivo deste documento:*** * responder * ***“o que este sistema permite fazer?”*** * e * ***“como o usuário utiliza cada funcionalidade?”*** *.*  
 *  
 Ele descreve exclusivamente comportamento observável, telas, fluxos, permissões, estados, validações e integrações percebidas pelo usuário. Não descreve tecnologia, arquitetura, código, infraestrutura ou armazenamento interno.*  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSPBCUZfEnoYmFDBhAU2QtIq6DIzW7UHAMBfnGt1V8fXEwAAXrse/wcF74lXkIsAAAAASUVORK5CYII=)  
**Sumário**  
1. [O que é o sistema](#anchor-1 "#anchor-1")  
2. [Perfis de usuário e visão geral de permissões](#anchor-2 "#anchor-2")  
3. [Mapa das telas](#anchor-3 "#anchor-3")  
4. [Funcionalidades detalhadas](#anchor-4 "#anchor-4")  
  - 4.1 [Página de apresentação](#anchor-5 "#anchor-5")  
  - 4.2 [Cadastro de credor](#anchor-6 "#anchor-6")  
  - 4.3 [Verificação de e-mail](#anchor-7 "#anchor-7")  
  - 4.4 [Login](#anchor-8 "#anchor-8")  
  - 4.5 [Esqueci minha senha / redefinição de senha](#anchor-9 "#anchor-9")  
  - 4.6 [Menu da conta (perfil do usuário)](#anchor-10 "#anchor-10")  
  - 4.7 [Painel corporativo](#anchor-11 "#anchor-11")  
  - 4.8 [Empresas (casos)](#anchor-12 "#anchor-12")  
  - 4.9 [Envio de documentos](#anchor-13 "#anchor-13")  
  - 4.10 [Consulta, visualização e download de documentos](#anchor-14 "#anchor-14")  
  - 4.11 [Status dos documentos](#anchor-15 "#anchor-15")  
  - 4.12 [Visibilidade do documento (público / privado)](#anchor-16 "#anchor-16")  
  - 4.13 [Exclusão de documentos](#anchor-17 "#anchor-17")  
  - 4.14 [Documentos de um cliente (visão do administrador)](#anchor-18 "#anchor-18")  
  - 4.15 [Clientes (aba do painel)](#anchor-19 "#anchor-19")  
  - 4.16 [E-mails e notificações](#anchor-20 "#anchor-20")  
  - 4.17 [Mensagens, carregamento e estados vazios](#anchor-21 "#anchor-21")  
  - 4.18 [Páginas de erro](#anchor-22 "#anchor-22")  
5. [Fluxos completos](#anchor-23 "#anchor-23")  
6. [Regras de negócio consolidadas](#anchor-24 "#anchor-24")  
7. [Integrações perceptíveis ao usuário](#anchor-25 "#anchor-25")  
8. [Navegação e elementos globais de interface](#anchor-26 "#anchor-26")  
9. [Validações funcionais consolidadas](#anchor-27 "#anchor-27")  
10. [Restrições, lacunas e comportamentos notáveis](#anchor-28 "#anchor-28")  
11. [Resumo por perfil: o que cada um pode fazer](#anchor-29 "#anchor-29")  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsSfYxZo/khWsYQLPJrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4qjBdKlX6OKAAAAAElFTkSuQmCC)  
**1. O que é o sistema**  
O sistema é o **Portal do Credor** da  **Case Administração Judicial**. É o ambiente onde credores de empresas em situação de  **Recuperação Judicial** ou  **Falência** envolvidos os documentos do processo e acompanham o andamento das suas solicitações, e onde a equipe da administração judicial organiza, analisa e defere esses documentos.  
O sistema atende a **dois públicos claramente distintos**:  
- **Portal do Credor** — voltado a credores e visitantes. Parte das empresas e documentos são  **publicamente visíveis**, inclusive por quem não tem cadastro.  
- **Painel da Administração Judicial** — restrito a usuários com perfil de administrador, que cadastram os casos (empresas), elegem quais documentos ficam públicos, analisam o conjunto enviado pelos credores e administram os usuários.  
O sistema não substitui o processo judicial: ele é um repositório e uma esteira de análise documental. A statusação de documentos (em análise / deferido / indeferido) é o indicador central de acompanhamento para o credor.  
**Vocabulário do domínio**  
| | |  
|-|-|  
| **Termo** | **Significado no sistema** |   
| **Empresa** | Um processo judicial em andamento (Recuperação Judicial ou Falência). É a “pasta” que recebe documentos. |   
| **Cliente / Credor** | Qualquer pessoa cadastrada que envia documentos para uma empresa. |   
| **Administrador** | Usuário da equipe da administração judicial, com poderes de gestão. |   
| **Documento** | Arquivo enviado por um cliente (ou por um administrador) vinculado a uma empresa. |   
| **Status do documento** | Situação da análise: **Em análise**,  **Deferido** ou  **Indeferido**. |   
| **Visibilidade** | Se o documento é **público** (visível a qualquer visitante) ou  **privado**. |   
| **AGC** | Assembleia Geral de Credores — citada na apresentação como um objetivo de habilitação do credor. |   
| **Natureza** | Classificação do processo: *Recuperação Judicial* ou  *Falência*. |   
| **Tipo de documento** | Categoria do envio: *Habilitação de crédito*,  *Divergência de crédito*,  *Habilitação ACG* ou  *Outros*. |   
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OQQmAABRAsSd4NIGRTPXNaQBrWMGbCFuCLTOzV2cAAPzFvVZbdXw9AQDgtesBhZQEOYZGgUEAAAAASUVORK5CYII=)  
**2. Perfis de usuário e visão geral de permissões**  
O sistema trabalha com **três situações de uso** (apenas as duas últimas exigem login):  
| | | |  
|-|-|-|  
| **Perfil** | **Quem é** | **O que enxerga** |   
| **Visitante** | Não possui conta, ou ainda não fez login | Página de apresentação, cadastro, recuperação de senha, o painel com as empresas de Recuperação Judicial e Falência e **somente os documentos públicos** dessas empresas. |   
| **Credor (cliente)** | Conta cadastrada com e-mail verificado | Tudo o que o visitante vê, mais: acesso à tela de envio de documentos, abertura de documentos públicos, privados dos administradores e os seus próprios, e o menu de conta. |   
| **Administrador** | Conta com perfil de administrador, além de e-mail verificado | Tudo o que o credor vê, mais: aba de **Clientes**, cadastro e edição de empresas, exclusão de empresas e de clientes, alteração de status de documentos, alternância de visibilidade público/privado e exclusão de qualquer documento. |   
   
**Observações importantes sobre perfis**  
- **Não existe na interface nenhuma forma de promover um usuário a administrador.** Todo cadastro novo nasce como credor comum. A concessão do perfil de administrador é feita fora do sistema, pela equipe do escritório.  
- **Administradores não podem ser excluídos pelo próprio sistema**: a tentativa é recusada com a mensagem de que não é permitido excluir usuários administradores.  
- **Um administrador não pode remover a si mesmo** da lista de clientes: a opção de remoção não aparece no próprio cartão.  
- **Não existe autoexclusão de conta.** Um credor que seja removido perde também todo o histórico de documentos que enviou.  
- **Visitantes e credores não veem a aba “Clientes”** e nem os botões de menu contextual dos cartões (editar / remover).  
**Matriz resumida de permissões**  
| | | | |  
|-|-|-|-|  
| **Ação** | **Visitante** | **Credor** | **Administrador** |   
| Ver página de apresentação, cadastro, login, recuperação de senha | ✅ | ✅ | ✅ |   
| Ver painel corporativo (empresas RJ e Falência) | ✅ | ✅ | ✅ |   
| Ver documentos **públicos** de uma empresa | ✅ | ✅ | ✅ |   
| Ver documentos **privados de administradores** | ❌ | ✅ | ✅ |   
| Ver os **próprios** documentos privados | ❌ | ✅ | ✅ |   
| Ver documentos privados de **outros credores** | ❌ | ❌ | ✅ |   
| Enviar documentos para uma empresa | ❌ | ✅ | ✅ |   
| Ver a aba **Clientes** | ❌ | ❌ | ✅ |   
| Ver a lista de documentos de um cliente | ❌ | ❌ | ✅ |   
| Cadastrar / editar empresa | ❌ | ❌ | ✅ |   
| Excluir empresa | ❌ | ❌ | ✅ |   
| Excluir cliente | ❌ | ❌ | ✅ |   
| Alterar status de documentos | ❌ | ❌ | ✅ |   
| Tornar documento público ou privado | ❌ | ❌ | ✅ |   
| Excluir documento | ❌ | apenas os próprios* | ✅ (qualquer) |   
| Alterar foto, nome, e-mail e senha da própria conta | ❌ | ✅ | ✅ |   
| Sair da conta | ❌ | ✅ | ✅ |   
   
* A permissão existe, mas **o botão de exclusão só está visível nas telas de gestão** (lista de documentos de um cliente), acessíveis a administradores. Na tela da empresa, o botão de excluir aparece apenas para administradores.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsSfYxZo/jzlMYQLPJrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4q7Bc870TqdAAAAAElFTkSuQmCC)  
**3. Mapa das telas**  
| | | |  
|-|-|-|  
| **Tela** | **Para quem** | **Finalidade** |   
| **Apresentação** | Visitantes | Explica o propósito do portal, lista o que o credor pode fazer e oferece atalhos para cadastro, login, contato e painel de documentos. |   
| **Cadastro** | Visitantes | Criação de nova conta de credor. |   
| **Login** | Visitantes | Entrada no sistema. |   
| **Esqueci minha senha** | Visitantes | Pedido do link de redefinição. |   
| **Redefinir senha** | Visitantes com link válido | Definição da nova senha. |   
| **Painel corporativo** | Todos (inclusive visitantes) | Lista de empresas por natureza, busca, aba de clientes (só admin). |   
| **Página da empresa** | Todos | Dados do processo + lista de documentos visíveis. |   
| **Adicionar documento** | Credor / admin | Envio de um ou vários documentos para a empresa selecionada. |   
| **Adicionar / Editar empresa** | Admin | Cadastro e edição dos dados do processo. |   
| **Documentos de um cliente** | Admin | Tabela com todos os documentos enviados por um credor, com status e estatísticas. |   
| **Menu (minha conta)** | Credor / admin | Foto, nome, e-mail e senha. |   
| **Erros** | Todos | Páginas de página inexistente, acesso proibido e demais falhas. |   
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AUBBAsUfyNTCi9VwgEA3sWGAjJK2CbjNzVGcAAPzFtapV7V9PAAB47X4AEW4ELQDBN+AAAAAASUVORK5CYII=)  
**4. Funcionalidades detalhadas**  
**4.1 Página de apresentação**  
**Quem vê:** visitantes (pessoas sem sessão ativa). É a página inicial do sistema.  
**O que ela faz:**  
- Boas-vindas ao “Portal do Credor”.  
- Explica que o espaço serve para **envio e gestão de documentos** ligados a processos de  **divergência / habilitação de crédito e procurações**, além de outras informações necessárias à Administração Judicial.  
- Lista, com marcadores de conferência, o que o credor pode fazer no portal:  
  1. Enviar documentos de forma rápida e segura;  
  2. Acompanhar o andamento das suas solicitações;  
  3. Manter seus dados atualizados junto à Administração Judicial;  
  4. Habilitar-se para participar da Assembleia Geral de Credores (AGC).  
- Oferece atalhos para: **cadastro**,  **login**,  **página de documentos** (painel corporativo) e  **contato por e-mail**.  
- Mostra os canais de atendimento da administração judicial: **telefone**,  **e-mail de contato** e  **endereço** (com mapa), além do rodapé com a marca e os direitos reservados.  
**Comportamento de navegação:** pessoas que já possuem conta são encaminhadas ao ambiente interno ao tentar acessar a apresentação.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OMQ2AABAAsSNBCkLfFDZwwIgHRiywEZJWQZeZ2ao9AAD+4lyruzq+ngAA8Nr1AOH0BedHjjlfAAAAAElFTkSuQmCC)  
**4.2 Cadastro de credor**  
**Quem usa:** visitante que ainda não tem conta.  
**Como funciona:**  
1. O visitante abre a tela de cadastro e informa **nome**,  **e-mail**,  **senha** e  **confirmação de senha**.  
2. Enquanto digita a senha, o sistema verifica os requisitos **em tempo real**, alternando um marcador de atendendo / não atendendo em cada regra:  
  - mínimo de 8 caracteres;  
  - uma letra maiúscula;  
  - uma letra minúscula;  
  - um número;  
  - um caractere especial;  
  - as duas senhas serem iguais.  
3. O botão de envio só fica disponível quando **todos** os requisitos são atendidos.  
4. Ao enviar, a conta é criada e o sistema **envia um e-mail de confirmação**.  
5. O visitante é devolvido à tela de login com o aviso de que o cadastro foi realizado e de que é necessário verificar o e-mail — **inclusive verificando a caixa de spam**.  
6. O cadastro **não** deixa o usuário logado: é preciso confirmar o e-mail e depois entrar.  
**Regras e validações:**  
- Nome: obrigatório, de **5 a 20 caracteres**, apenas letras (aceita acentos).  
- E-mail: obrigatório, formato válido, **único** no sistema (e-mail já cadastrado é recusado com aviso específico), máximo de 255 caracteres.  
- Senha: obrigatória, mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial (@ $ ! % * ? &).  
- Confirmação de senha: obrigatória e igual à senha.  
- **Limite de contas por origem:** cada endereço de rede pode criar no máximo  **5 contas**. Ao ultrapassar, o sistema recusa o novo cadastro e informa o limite.  
- O endereço de origem do cadastro é registrado e usado para aplicar esse limite.  
**Mensagens ao usuário:** sucesso do cadastro (com aviso para checar o spam), e-mail já cadastrado, lista de erros de validação e limite de contas atingido.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSPBCj5fFyM6mJHAjAU2QtIq6DIzW7UHAMBfnGt1V8fXEwAAXrsexOEF35f1aEgAAAAASUVORK5CYII=)  
**4.3 Verificação de e-mail**  
**Quem usa:** o credor recém-cadastrado ou aquele cujo e-mail ainda não foi confirmado.  
**Como funciona:**  
- O e-mail de confirmação chega com assunto de **“Confirmação de email”**, personalizado com o nome do usuário, e um botão  **“VERIFICAR E-MAIL”**.  
- Ao clicar, o e-mail é marcado como confirmado e o usuário é levado à tela de login com a mensagem **“E-mail verificado com sucesso!”** e a observação de que a outra aba pode ser fechada.  
- Se o link for inválido ou adulterado, o sistema informa **“O link de verificação não é válido.”**  
**Reenvio do link:**  
- Na tela de login, quando o usuário tenta entrar com um e-mail ainda não verificado, aparece o aviso **“Necessário validar o e-mail.”** e um botão  **“REENVIAR E-MAIL”** já preenchido com o endereço informado.  
- **Regras de reenvio:**  
  - é preciso aguardar **5 minutos** entre dois reenvios para o mesmo usuário;  
  - existe um limite de **6 pedidos por minuto**;  
  - e-mails **já verificados ou inexistentes** geram a mensagem  **“O e-mail fornecido não está registrado ou já foi verificado.”**  
- Após o reenvio, o sistema orienta a verificar também a caixa de spam.  
- O link de confirmação tem validade limitada no tempo (expira).  
**Consequência prática:**  **sem e-mail verificado o login é bloqueado**. A sessão é encerrada e o usuário volta à tela de login.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OQQmAABRAsSd49m4v6wg/pwmMYQVvImwJtszMXp0BAPAX91pt1fH1BACA164Hoq8EQMMPmF8AAAAASUVORK5CYII=)  
**4.4 Login**  
**Quem usa:** visitantes que já possuem conta verificada.  
**Como funciona:**  
1. O usuário informa e-mail e senha e clica em **ENTRAR**.  
2. Se as credenciais estiverem corretas **e** o e-mail estiver verificado, o acesso é liberado e o usuário chega ao  **painel corporativo**.  
3. O botão de **olho** ao lado do campo de senha permite exibir ou ocultar a senha digitada.  
**Regras e mensagens:**  
- E-mail e senha são obrigatórios; o e-mail é normalizado (minúsculas e sem espaços).  
- Credenciais inválidas → **“Credenciais inválidas.”**  
- Conta existente com e-mail não verificado → **“Necessário validar o e-mail.”**, com opção de reenviar a confirmação.  
- Após o login bem-sucedido, todos os perfis (credor e administrador) entram no mesmo painel; as diferenças de conteúdo são dadas pelo perfil.  
**Sair da conta:** disponível no menu do usuário, no topo direito. Ao sair, o usuário retorna à tela de login.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAABRAsSdYxKa/i8WMIR7ECt5E2BJsmZmt2gMA4C+Otbqr8+sJAACvXQ85PAYartXEogAAAABJRU5ErkJggg==)  
**4.5 Esqueci minha senha / redefinição de senha**  
**Quem usa:** qualquer pessoa com conta cadastrada e não autenticada.  
**Fluxo:**  
1. Na tela de login, o usuário clica em **“Esqueceu sua senha?”**.  
2. Informa o **e-mail cadastrado** e clica em  **“ENVIAR LINK”**.  
3. Se o e-mail existir, o sistema confirma o envio (**“E-mail de redefinição enviado!”**); caso contrário, informa que não foi encontrado usuário com aquele endereço.  
4. O e-mail chega com assunto **“Redefinição de senha”**, personalizado com o nome, e um botão  **“REDEFINIR SENHA”**.  
5. Ao clicar, abre-se a tela de redefinição, que exibe o e-mail em modo somente leitura e pede **nova senha** e  **confirmação**.  
6. Os requisitos de senha são verificados em tempo real (mesma lista do cadastro) e o botão **“REDEFINIR”** só é liberado quando todos forem atendidos.  
7. Concluído, o sistema confirma **“Senha redefinida com sucesso!”** e leva o usuário ao login.  
8. Link inválido, expirado ou já utilizado é recusado com mensagem específica.  
**Regras de senha redefinida:** obrigatório, mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial, e confirmação igual.  
**Segurança adicional:** ao redefinir a senha, as  **demais sessões abertas do usuário são encerradas** (troca de senha desconecta outros dispositivos).  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsSfYxZo/jVEMYQLPJrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4rLBc059ysnAAAAAElFTkSuQmCC)  
**4.6 Menu da conta (perfil do usuário)**  
**Quem usa:** credores e administradores autenticados. O acesso é pelo item  **“Menu”** no menu do usuário, no topo da tela.  
A tela tem três cartões:  
***a) Foto de perfil***  
- Mostra a foto atual ou, quando não há foto, um ícone de pessoa como imagem padrão.  
- **Alterar imagem:** o usuário escolhe um arquivo de imagem; ele é enviado e a foto passa a aparecer no cabeçalho do sistema, no menu e nas telas que exibem a imagem do cliente.  
- **Remover imagem:** disponível apenas quando existe foto; exige confirmação e, após a remoção, o ícone padrão volta a ser exibido.  
- **Regras:** apenas imagens  **JPG, JPEG ou PNG**; tamanho máximo de  **2 MB** (o sistema também avisa, antes do envio, se o arquivo passar de 5 MB). Arquivo que não seja imagem é recusado com aviso.  
***b) Nome e e-mail***  
- Campos preenchidos com os dados atuais.  
- O botão **Salvar** só fica disponível quando há alteração  **e** os campos estão preenchidos e válidos.  
- **Regras:** nome de 5 a 20 caracteres, apenas letras; e-mail válido, único no sistema e com no máximo 255 caracteres.  
- Ao salvar com sucesso, o nome e o novo e-mail passam a aparecer no cabeçalho e no painel.  
- O novo e-mail é gravado em minúsculas.  
- **Observação de comportamento:** a troca de e-mail  **não** dispara um novo processo de verificação — a conta continua ativa com o novo endereço.  
- Mensagens: sucesso (“Dados atualizados!”), e-mail já utilizado, formato inválido, nome fora das regras e erro inesperado.  
***c) Senha***  
- Campos: **senha atual**,  **nova senha** e  **confirmar nova senha**, todos com botão de mostrar/ocultar.  
- Um ícone de informação abre um **pop-up com os requisitos de senha** (mínimo de 8 caracteres, uma maiúscula, uma minúscula, um número, um caractere especial e senhas iguais).  
- O botão **Salvar** só é liberado quando os três campos estão preenchidos e a nova senha atende aos requisitos.  
- **Regras:** a senha atual é conferida (senha incorreta é recusada com “Senha atual incorreta.”); a nova senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial (@ $ ! % * ? &); a confirmação deve ser idêntica; e  **a nova senha não pode ser igual à senha atual**.  
- Mensagens: sucesso (“Senha alterada com sucesso!”), senha atual incorreta, senha fraca, confirmação divergente e senha igual à atual.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNBCkJfE1pYGfHAiAU2QtIq6DIzW7UHAMBfnGt1V8fXEwAAXrse4dwF6o2O55YAAAAASUVORK5CYII=)  
**4.7 Painel corporativo**  
**Quem vê:** todos — visitantes, credores e administradores. É a tela de entrada após o login e o ponto de partida para ver documentos.  
**Estrutura da tela:**  
- Título **“Painel corporativo”**.  
- Campo de busca com lupa, orientado a procurar por **nome da empresa, número do processo ou cliente**.  
- **Abas** que separam os processos por natureza:  
  - **Recuperação Judicial** — disponível para todos;  
  - **Falência** — disponível para todos;  
  - **Clientes** —  **exclusiva de administradores**.  
**Cartão de empresa (Recuperação Judicial / Falência):**  
- Ícone que diferencia a natureza (prédio / alerta) e o **nome da empresa**.  
- **Número do processo**.  
- **Data de cadastro** da empresa no sistema.  
- Botão **ACESSAR**, que abre a página da empresa com a lista de documentos.  
- **Menu de três pontinhos (somente administradores)**, com duas ações:  
  - **EDITAR** — abre a edição dos dados do processo;  
  - **REMOVER** — pede confirmação e, se confirmado, exclui a empresa e o cartão desaparece da lista.  
**Cartão de cliente (aba Clientes, somente administradores):**  
- **Nome**,  **e-mail** e  **data de criação** da conta.  
- Selo que distingue **Administrador** de  **Cliente**.  
- **Empresas com documentos**: exibe até três etiquetas com o nome da empresa e sua natureza (RJ / Fal.) e, havendo mais, o indicador  **“+N mais”**.  
- Campo de busca específico **por nome da empresa**, que atua junto da busca geral (por nome/e-mail do cliente) para localizar os clientes que têm documentos em determinado processo.  
- Botão **ACESSAR**, que abre a lista de documentos daquele cliente.  
- **Menu de três pontinhos (administradores, exceto sobre o próprio cartão)**, com a ação  **REMOVER** (exclusão do cliente).  
**Comportamento da busca e dos filtros:**  
- A busca é **instantânea**, enquanto o usuário digita, e filtra os cartões da aba ativa.  
- Na aba de clientes, é possível combinar a busca geral (nome / e-mail) com a busca por nome da empresa.  
- Quando nenhum resultado é encontrado **com busca ativa**, a tela exibe o aviso  **“Nenhum resultado encontrado — tente buscar por outro termo”**.  
- Sem busca, se não houver itens cadastrados, a tela exibe o estado vazio próprio de cada aba:  
  - “Nenhuma empresa encontrada — nenhuma empresa de Recuperação Judicial foi cadastrada ainda”;  
  - “Nenhuma empresa encontrada — nenhuma empresa em Falência foi cadastrada ainda”;  
  - “Nenhum cliente encontrado — nenhum cliente foi cadastrado ainda”.  
- Cartões são animados na exibição e títulos longos são ajustados para caber no cartão.  
**Feedback de remoção:** ao excluir empresa ou cliente, o cartão desaparece com animação e surge uma notificação de sucesso ( **“Empresa/Cliente ‘nome’ foi removido(a) com sucesso!”**); em caso de falha, aparece uma notificação de erro.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OQQmAABRAsSd4EKxgBjP+Asa0hxW8ibAl2DIzR3UFAMBf3Gu1VefXEwAAXtsfSqwDVbgKngwAAAAASUVORK5CYII=)  
**4.8 Empresas (casos)**  
***a) Cadastro de empresa***  
**Quem usa:** apenas administradores. O acesso é pelo item  **“Empresas”** no cabeçalho (visível somente para administradores).  
**Dados solicitados (todos obrigatórios):**  
| | | |  
|-|-|-|  
| **Campo** | **Descrição** | **Observações** |   
| **Nome da empresa** | Razão social / identificação do processo | até 300 caracteres |   
| **Administrador Judicial** | Responsável pela administração judicial do caso | até 300 caracteres |   
| **Juiz de direito** | Magistrado responsável | até 300 caracteres |   
| **Natureza** | Lista com **Recuperação Judicial** ou  **Falência** | define em qual aba o processo aparece |   
| **Número do processo** | Identificação judicial | até 50 caracteres, aceitando letras, números, ponto, hífen e barra |   
| **Protocolo** | Data do protocolo | obrigatório, em formato de data |   
| **Autor** | Autor do processo | até 300 caracteres |   
| **Comarca / Escrivania** | Vara/comarca e escrivania | até 300 caracteres, exibido como “Vara” na página do processo |   
| **Observações** | Avisos e observações do caso | até 300 caracteres, exibidos como bloco “OBS/AVISOS” na página do processo |   
   
**Comportamento:**  
- O botão **ADICIONAR** grava o caso e exibe a confirmação  **“Empresa cadastrada com sucesso!”**.  
- O formulário **mantém os dados digitados** quando há erro de validação, para que o usuário não precise redigitar tudo.  
- Erros de validação são exibidos como notificações, com a lista dos campos incorretos.  
- O **número do processo** não aceita caracteres fora do padrão permitido (apenas letras, números, ., - e /).  
***b) Edição de empresa***  
**Quem usa:** apenas administradores, pelo menu  **EDITAR** do cartão da empresa no painel.  
- Abre o **mesmo formulário** do cadastro, já preenchido com os dados atuais e com o título  **“Editar empresa”**.  
- As mesmas validações do cadastro são aplicadas.  
- O botão passa a ser **SALVAR**, e o sucesso é confirmado com  **“Empresa atualizada com sucesso!”**.  
- É possível alterar qualquer um dos campos, inclusive a **natureza** (o processo muda de aba) e o  **protocolo**.  
***c) Exclusão de empresa***  
**Quem usa:** apenas administradores, pelo menu  **REMOVER** do cartão (com confirmação: “Tem certeza que deseja remover a empresa ‘nome’?”).  
- A empresa e todos os seus documentos deixam de existir no sistema (a listagem de documentos é zerada junto com a empresa).  
- O cartão sai do painel e uma notificação de sucesso é exibida.  
- Não há como desfazer a exclusão.  
***d) Página da empresa (detalhes do processo e documentos)***  
Aberta pelo botão **ACESSAR** do cartão.  
**Bloco de dados do processo (lateral):**  
- Número do processo, Administrador Judicial, Vara (Comarca/Escrivania), Juiz de Direito, Protocolo (data formatada) e o bloco **OBS/AVISOS** com as observações cadastradas. Quando um dado não existe, é exibido  **“Não informado”** e, no bloco de avisos,  **“Nenhum aviso disponível.”**  
- Botão **ENVIAR DOCUMENTOS**, que abre a tela de envio para aquela empresa. Para quem não está autenticado, o destino exige login.  
**Botão VOLTAR** no topo, que devolve ao painel corporativo.  
**Lista de documentos:**  
- Cabeçalho com o **nome da empresa**.  
- Cada documento aparece como um cartão com ícone, **nome** (clicável) e,  **para administradores**, as informações detalhadas:  
  - **Status** (selo colorido);  
  - **Adicionado por** (nome do usuário que enviou);  
  - **Tipo** (Habilitação de crédito, Divergência de crédito, Habilitação ACG ou o tipo informado livremente);  
  - **Visibilidade** (selo  **Público** com ícone de globo, ou  **Privado** com ícone de cadeado).  
- **Ações disponíveis para administradores em cada documento:**  
  - alternar **visibilidade** (botão de olho) — pede confirmação;  
  - **excluir** o documento — pede confirmação com o aviso de que a ação não pode ser desfeita.  
- **Filtro de documentos (credor autenticado):** um seletor permite alternar entre  
  - **Todos os documentos** — os seus, os dos administradores e os públicos;  
  - **Meus documentos** — apenas os enviados por você;  
  - **Documentos dos administradores** — apenas os enviados pela administração judicial.  
   
 Quando o filtro não encontra nada, é exibido o aviso **“Nenhum documento encontrado para o filtro selecionado.”**  
- **Visitantes** veem apenas os documentos públicos, sem filtro e sem botões de ação.  
- Se a empresa não tiver documentos visíveis, é exibido **“Nenhum documento encontrado para essa empresa.”**  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OMQ2AABAAsSNhRAF6EPYDLhGADSywEZJWQZeZ2aszAAD+4l6rrTq+ngAA8Nr1AIWsBDYDm5cLAAAAAElFTkSuQmCC)  
**4.9 Envio de documentos**  
**Quem usa:** credores e administradores autenticados com e-mail verificado. O acesso é pelo botão  **ENVIAR DOCUMENTOS** na página da empresa.  
**Como funciona:**  
1. A tela exibe a **empresa selecionada** (que vem da página de origem e não pode ser alterada durante o envio).  
2. O usuário informa a **quantidade de documentos** que deseja enviar (mínimo 1) e clica em  **Adicionar**.  
3. O sistema gera **um formulário por documento**, cada um com:  
  - **Tipo de documento** — lista com *Habilitação de crédito*,  *Divergência de crédito*,  *Habilitação ACG* e  *Outros*;  
  - **Especificação do tipo** — campo de texto que aparece quando a opção  **“Outros”** é escolhida e passa a ser obrigatório;  
  - **Nome do documento** (obrigatório);  
  - **Descrição do documento** (obrigatório);  
  - **Arquivo** (obrigatório).  
4. O botão **Enviar Todos** aparece quando há formulários na tela.  
5. Durante o envio, o sistema exibe **barra de progresso do envio**, com percentual e o texto animado de progresso, e o status individual de cada documento.  
6. Ao final, o usuário recebe o resumo: **“Concluído: X de Y documentos enviados com sucesso!”**  
  - Se todos saírem bem, os formulários são limpos e a lista é atualizada após alguns segundos.  
  - Se houver falhas, o sistema informa quantos documentos não puderam ser enviados e mantém em tela os que falharam para nova tentativa.  
**Comportamentos de envio:**  
- Os arquivos são enviados **em grupos de até 3 simultâneos**, para envio mais rápido.  
- O campo de arquivo é **reiniciado** após o envio, permitindo preparar o mesmo formulário para outro arquivo.  
- Erros de validação são exibidos por documento e também em um aviso geral no topo da tela.  
- A tela não exibe o indicador de carregamento global durante o envio (há um indicador próprio de progresso).  
**Validações aplicadas:**  
- **Formatos aceitos:** PDF, JPEG, JPG, PNG, DOCX e XLSX. Arquivos de outro tipo são recusados antes do envio, com a lista de formatos aceitos.  
- **Tamanho máximo por arquivo:** 40 MB (verificação feita antes do envio).  
- Nome do documento: obrigatório, até 255 caracteres.  
- Descrição: até 1000 caracteres.  
- Tipo: obrigatório.  
- Empresa: obrigatória e precisa existir.  
**O que fica registrado junto do documento:** nome de quem enviou, data e hora do envio, tamanho, formato do arquivo e uma identificação do  **conteúdo** do arquivo — usada para impedir que o mesmo arquivo seja enviado duas vezes (ver [6.2).](#anchor-30 "#anchor-30")  
**Aviso automático:** a cada documento gravado, é disparado um e-mail de notificação à administração judicial (ver [4.16). Falha no envio do e-mail  **não** interrompe nem desfaz o envio do documento.](#anchor-20 "#anchor-20")  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsSeYxZw/lVeDGMACBrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA6fOBdd+dKAKAAAAAElFTkSuQmCC)  
**4.10 Consulta, visualização e download de documentos**  
**Quem usa:** todos os perfis, respeitando a visibilidade do documento.  
**Como funciona:**  
- O **nome do documento** é um link que abre o arquivo em uma  **nova aba**.  
- **Arquivos que abrem direto no navegador:** PDF, imagens (JPG, JPEG, PNG, GIF, WEBP, SVG) e textos simples (TXT, HTML, CSV) — são exibidos na própria aba.  
- **Demais formatos** (DOCX, XLSX e outros) são  **baixados** para o computador do usuário.  
- O arquivo é entregue com o **nome do documento** definido no envio, completando a extensão original quando o nome não a tiver.  
- Cada documento enviado tem o seu **identificador numérico** exibido junto ao nome (na tela de documentos do cliente).  
- Documento inexistente, removido ou sem arquivo disponível apresenta a página de erro correspondente.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAABRAsad4FCtY9ecwnkms4E2ELcGWmTmrKwAA/uLeqrU6vp4AAPDa/gDzUgM9+S8z3AAAAABJRU5ErkJggg==)  
**4.11 Status dos documentos**  
**Estados possíveis (3 estados):**  
| | | |  
|-|-|-|  
| **Status** | **Significado** | **Cor do selo** |   
| **Em análise** | Estado inicial/padrão de todo documento enviado; aguardando decisão | Amarelo (atenção) |   
| **Deferido** | Documento aceito | Verde (sucesso) |   
| **Indeferido** | Documento recusado | Vermelho (erro) |   
   
**Quem altera:** apenas administradores, na tela de  **documentos de um cliente** (ver [4.14).](#anchor-18 "#anchor-18")  
**Como alterar:**  
1. O administrador clica sobre o selo de status da linha do documento.  
2. O selo é substituído por uma **lista suspensa** com os três status.  
3. Ao escolher um valor, o selo volta a ser exibido com a nova cor e aparece a marca de **“editado — era: ”**.  
4. Clicar fora da célula cancela a edição em andamento.  
5. Havendo uma ou mais alterações, aparece o botão **SALVAR ALTERAÇÕES**.  
6. Ao salvar, o sistema confirma com **“Alterações salvas com sucesso!”** e a tela é recarregada já com os novos status. Em caso de falha, avisa e mantém o botão disponível para nova tentativa.  
**Regras:**  
- Um documento **nunca** fica sem status: ao ser enviado, já entra como  **Em análise**.  
- As alterações são gravadas em conjunto (vários documentos podem ser mudados antes de salvar).  
- Se o administrador voltar o status ao valor original, a alteração é descartada e o botão de salvar deixa de aparecer.  
- **Não há histórico de alterações de status** visível: o sistema guarda apenas o status atual.  
- O credor acompanha o resultado das suas solicitações por aqui — o status é a forma de comunicação entre a administração judicial e o credor.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNBCUpfD6ZYGZDAgAU2QtIq6DIzW7UHAMBfHGt1V+fXEwAAXrseHCoGAe/SKtAAAAAASUVORK5CYII=)  
**4.12 Visibilidade do documento (público / privado)**  
**Estados possíveis (2 estados):**  
| | |  
|-|-|  
| **Visibilidade** | **Quem consegue ver** |   
| **Público** | Qualquer pessoa, inclusive visitantes sem login |   
| **Privado** | Apenas o dono do documento, os administradores e os demais usuários logados quando o documento foi enviado por um administrador |   
   
**Quem altera:** apenas administradores, pelo botão de olho em cada documento na página da empresa (com confirmação: “Deseja alterar a visibilidade deste documento?”).  
**Regra automática de origem:** quando um  **administrador** envia um documento, ele nasce  **público**; quando um  **credor** envia, nasce  **privado**. A partir daí, o administrador pode alternar a qualquer momento.  
**Onde a visibilidade aparece:** na página da empresa, cada documento exibe o selo  **Público** (globo) ou  **Privado** (cadeado). O botão de ação mostra a ação oposta (“Tornar privado” / “Tornar público”).  
**Efeito da alteração:** o documento passa a aparecer (ou a sumir) da lista de visitantes e das listas dos demais credores, conforme a matriz de visibilidade da seção [6.1.](#anchor-31 "#anchor-31")  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OQQmAABRAsSd4NIGBzPXBmAawhhW8ibAl2DIze3UGAMBf3Gu1VcfXEwAAXrsehaQEN+8fLHEAAAAASUVORK5CYII=)  
**4.13 Exclusão de documentos**  
**Quem pode excluir:** o  **dono** do documento ou um  **administrador**.  
**Como funciona:**  
- O botão de exclusão (ícone de lixeira) aparece nas telas de gestão, ao lado do documento.  
- A exclusão exige **confirmação** com o aviso:  **“Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.”**  
- Após a confirmação, o sistema confirma o resultado e a lista é atualizada.  
- A exclusão remove **o documento e o arquivo enviado** — o conteúdo deixa de existir no sistema.  
- Em caso de recusa por falta de permissão, o usuário recebe a mensagem **“Você não tem permissão para excluir este documento!”**  
- Documento inexistente gera o aviso de que o documento não foi encontrado.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OMQ2AABAAsSNBCkLfFR7wwIgHRiywEZJWQZeZ2ao9AAD+4lyruzq+ngAA8Nr1AOIEBeX8aGZPAAAAAElFTkSuQmCC)  
**4.14 Documentos de um cliente (visão do administrador)**  
**Quem usa:** apenas administradores. O acesso é pelo botão  **ACESSAR** no cartão do cliente (aba “Clientes” do painel).  
**Cabeçalho da tela:**  
- Foto do cliente (ou ícone de pessoa), **nome** e  **e-mail**.  
- **Botão VOLTAR** para o painel.  
**Indicadores (statísticas) do cliente:**  
- Total de documentos;  
- Documentos **Em Análise**;  
- Documentos **Deferidos**;  
- Documentos **Indeferidos**.  
**Tabela de documentos**, do mais recente para o mais antigo, com as colunas:  
| | |  
|-|-|  
| **Coluna** | **Conteúdo** |   
| **Documento** | Ícone, nome (link para abrir/baixar) e o **ID** do documento |   
| **Tipo** | Habilitação de crédito / Divergência de crédito / Habilitação ACG / tipo informado |   
| **Empresa** | Nome da empresa destinatária do documento |   
| **Status** | Selo colorido, **clicável e editável** (ver [4.11)](#anchor-15 "#anchor-15") |   
| **Ações** | Botão de **excluir** o documento (com confirmação) |   
   
**Paginação:** os documentos são exibidos  **10 por página**, com controles de navegação.  
**Comportamento especial:** se o cliente  **não tiver nenhum documento**, o sistema exibe um aviso  **“Nenhuma informação para esse usuário.”** e devolve o administrador ao painel.  
**Observação de comportamento:** os indicadores e a tabela refletem  **a página de resultados que está sendo exibida** no momento, e não o total histórico do cliente.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OMQ2AABAAsSNBACPykMH4NpGACyywEZJWQZeZ2aszAAD+4l6rrTo+jgAA8N71AL/CBEiG5xPoAAAAAElFTkSuQmCC)  
**4.15 Clientes (aba do painel)**  
**Quem usa:** apenas administradores. A aba  **“Clientes”** aparece no painel somente para eles.  
**O que a aba oferece:**  
- Lista de **todos os usuários cadastrados** (administradores e credores), em ordem alfabética de nome, cada um em um cartão.  
- Dados exibidos: nome, e-mail, data de criação da conta, selo de perfil (Administrador ou Cliente) e as **empresas com as quais o usuário tem documentos** (até três etiquetas + indicador de quantas faltam).  
- Busca por nome/e-mail do cliente e **busca separada por nome da empresa**, que permite localizar rapidamente os clientes que têm documentos em determinado processo.  
- Botão **ACESSAR**, que abre a lista de documentos do cliente ([4.14).](#anchor-18 "#anchor-18")  
- Menu **REMOVER** para excluir o cliente (não aparece sobre o próprio cartão).  
**Remoção de cliente:**  
1. O administrador aciona **REMOVER** e confirma a mensagem  **“Tem certeza que deseja remover o cliente ‘nome’?”**  
2. Em caso de sucesso, o cartão desaparece e surge a notificação **“Cliente ‘nome’ foi removido com sucesso!”**  
3. A exclusão de um cliente **remove também todos os documentos enviados por ele** (registros e arquivos), além da foto de perfil.  
4. **Não é permitido remover usuários administradores** — a tentativa é recusada com o aviso de que não é permitido excluir usuários administradores.  
5. Não é possível remover o próprio administrador.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAM0lEQVR4nO3OUQmAQBBAwSdcjsu6HYxoDsEK/okwk2COmdnVGQAAf3GtalX76wkAAK/dDxFWBDkFf6+SAAAAAElFTkSuQmCC)  
**4.16 E-mails e notificações**  
O sistema se comunica por e-mail em três ocasiões, todas em português e com a identidade visual do escritório:  
| | | |  
|-|-|-|  
| **E-mail** | **Destinatário** | **Conteúdo** |   
| **Confirmação de email** | O próprio credor, no cadastro | Saudação personalizada com o nome e botão **“VERIFICAR E-MAIL”** que libera o acesso ao sistema. |   
| **Redefinição de senha** | O próprio usuário, ao solicitar a recuperação | Explica que a solicitação partiu do usuário e traz o botão **“REDEFINIR SENHA”**. |   
| **Novo documento adicionado** | Endereço interno fixo da administração judicial | Assunto **“Novo documento adicionado por <nome do usuário>”** e as informações:  **nome do documento**,  **empresa**,  **adicionado por**,  **tipo**,  **descrição** (quando informada) e  **data/hora** do envio. Assinado pela Case Administração Judicial. |   
   
**Regras do aviso de novo documento:**  
- É enviado **a cada documento** gravado, mesmo em envios múltiplos.  
- É disparado **depois** de o documento ser salvo com sucesso.  
- **Falha no envio do e-mail não impede nem desfaz o envio do documento** — o credor recebe a confirmação normalmente e a equipe é avisada internamente do problema.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OUQmAABBAsSeYxZyXSzCJASxgACv4J8KWYMvMbNURAAB/ca7VXe1fTwAAeO16AKe+BdmJqrPdAAAAAElFTkSuQmCC)  
**4.17 Mensagens, carregamento e estados vazios**  
**Tipos de retorno ao usuário:**  
- **Notificações temporárias** (canto da tela, com ícone de confirmação ou de alerta), que aparecem sozinhas e desaparecem após alguns segundos — usadas em remoções, cadastro/edição de empresa e alterações de perfil.  
- **Alertas dentro das telas** — sucesso (verde) e erro (vermelho) em cadastro, login, recuperação de senha, envio de documentos e perfil.  
- **Alertas de confirmação do navegador** em decisões críticas: exclusões e salvamento de status.  
- **Avisos dentro das telas** — “Nenhum resultado encontrado”, “Nenhum documento encontrado para essa empresa”, “Nenhum documento encontrado para o filtro selecionado”, “Nenhuma informação para esse usuário” e os estados vazios de cada aba do painel.  
**Indicador de carregamento:**  
- Um indicador global (ícone girando ao centro da tela) aparece durante o envio de formulários e durante as operações em segundo plano da página.  
- Ele fica suprimido nas telas de envio de documentos, que têm o próprio indicador de progresso.  
**Facilidades de uso em formulários:**  
- Botão de **mostrar/ocultar senha** em todas as telas com senha (login, cadastro, recuperação, redefinição e perfil).  
- Campos de senha com **verificação em tempo real** dos requisitos, com marcador visual de conforme/não conforme.  
- Botões de envio **desabilitados** enquanto os pré-requisitos não forem atendidos.  
- Manutenção dos dados já digitados quando há erro de validação, para não obrigar o usuário a recomeçar.  
- Confirmação antes de todas as ações destrutivas.  
- Indicação visual de qual bloco está sendo editado na página da conta, com retorno automático ao bloco correspondente após salvar.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNhZscVjnidKEAGFtgISaugy8zs1RkAAH9xr9VWHV9PAAB47XoAor8EPg1yCpUAAAAASUVORK5CYII=)  
**4.18 Páginas de erro**  
O sistema exibe páginas de erro próprias, com a marca do escritório e a opção de voltar ao painel:  
| | |  
|-|-|  
| **Erro** | **O que o usuário vê** |   
| **404 — Página não Encontrada** | Endereço inexistente ou registro que não existe mais (empresa, documento ou usuário removido) |   
| **403 — Acesso Proibido** | Tentativa de acessar algo restrito a administradores, ou documento privado de outra pessoa |   
| Demais erros (400, 401, 402, 405, 408, 419, 429, 500, 503) | Telas de erro padronizadas do sistema, sempre com a marca e com a opção de retornar ao painel |   
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsSeYxZw/lVeDGMACBrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA6fOBdd+dKAKAAAAAElFTkSuQmCC)  
**5. Fluxos completos**  
**Fluxo 1 — Novo credor até o primeiro envio**  
1. Visitante abre a página inicial do portal.  
2. Clica em **cadastro** e preenche nome, e-mail e senha (acompanhando os requisitos em tempo real).  
3. Recebe o e-mail de confirmação, clica em **VERIFICAR E-MAIL** e volta ao login.  
4. Faz **login** e chega ao painel corporativo.  
5. Localiza a empresa na aba **Recuperação Judicial** ou  **Falência** (usa a busca se necessário).  
6. Clica em **ACESSAR**, confere os dados do processo e as observações.  
7. Clica em **ENVIAR DOCUMENTOS**, informa quantos arquivos vai enviar, preenche tipo / nome / descrição de cada um e clica em  **Enviar Todos**.  
8. Acompanha o progresso e recebe a confirmação de envio.  
9. Consulta periodicamente a mesma empresa para acompanhar o **status** dos seus documentos.  
**Fluxo 2 — Análise e statusação pela administração judicial**  
1. Administrador entra no painel e abre a aba **Clientes**.  
2. Localiza o credor (por nome, e-mail ou pelo nome da empresa em que ele tem documentos).  
3. Clica em **ACESSAR** e vê a tabela de documentos do cliente, com o total e a separação por status.  
4. Para cada documento, clica no selo de status e escolhe **Deferido** ou  **Indeferido** (ou mantém  **Em análise**).  
5. Clica em **SALVAR ALTERAÇÕES** e recebe a confirmação.  
**Fluxo 3 — Definir o que é público**  
1. Administrador abre a página de uma empresa.  
2. Analisa os documentos apresentados (com status, autor do envio, tipo e visibilidade).  
3. Usa o botão de olho para **tornar público** o que deve ficar disponível a qualquer visitante — ou  **tornar privado** o que deve ficar restrito.  
4. Confirma a alteração; a visibilidade passa a valer imediatamente para todas as listagens.  
**Fluxo 4 — Abrir a documentação do processo**  
1. Administrador cadastra a empresa com nome, administrador judicial, juiz de direito, natureza, número do processo, protocolo, autor, comarca/escrivania e observações.  
2. A empresa passa a aparecer na aba correspondente à sua natureza.  
3. Sempre que precisar ajustar dados (inclusive trocar a natureza), usa **EDITAR** no cartão da empresa.  
**Fluxo 5 — Remover cadastros**  
1. Administrador abre o menu de três pontinhos do cartão da empresa ou do cliente.  
2. Seleciona **REMOVER** e confirma.  
3. O cartão desaparece com confirmação visual; no caso do cliente, todos os documentos dele também são removidos.  
**Fluxo 6 — Manutenção da própria conta**  
1. Usuário acessa **Menu** no topo da tela.  
2. Atualiza a **foto de perfil** (ou a remove).  
3. Corrige **nome e e-mail**.  
4. Troca a **senha** informando a atual e escolhendo uma nova que atenda aos requisitos.  
5. Sai da conta pelo menu do usuário.  
**Fluxo 7 — Recuperação de acesso**  
1. Usuário clica em **Esqueceu sua senha?**  
2. Informa o e-mail e recebe o link de redefinição.  
3. Define a nova senha atendendo aos requisitos.  
4. Entra novamente com a nova senha; as sessões abertas em outros dispositivos foram encerradas.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNhwgJe0PYTKpnRgQU2QtIq6DIze3UGAMBf3Gu1VcfXEwAAXrseaIEEMYtKmi4AAAAASUVORK5CYII=)  
**6. Regras de negócio consolidadas**  
**6.1 Matriz de visibilidade de documentos**  
| | | | |  
|-|-|-|-|  
| **Situação** | **Documento público** | **Documento privado enviado por ** **credor** | **Documento privado enviado por ** **administrador** |   
| **Visitante** | ✅ vê | ❌ não vê | ❌ não vê |   
| **Credor** | ✅ vê | ✅ vê os seus; ❌ os de outros | ✅ vê |   
| **Administrador** | ✅ vê | ✅ vê | ✅ vê |   
   
**Regras adicionais de listagem:**  
- Na página de uma empresa, o **administrador visualiza apenas os documentos enviados por administradores**.  
- Na página de uma empresa, o **credor** visualiza os documentos públicos, os enviados por administradores e os seus próprios.  
- O **visitante** visualiza apenas os documentos públicos.  
- Abrir um documento restrito diretamente pelo link apresenta **Acesso Proibido (403)** a quem não tem permissão.  
- Documento sem arquivo disponível apresenta **Página não Encontrada (404)**.  
**6.2 Ciclo de vida do documento**  
[envio pelo credor]  →  Em análise (privado)  →  Deferido / Indeferido  →  [exclusão]  
 [envio pelo admin]   →  Em análise (público)  →  Deferido / Indeferido  →  [exclusão]  
                                    ↕  
                      [público ⇄ privado — alternância pelo administrador]  
   
- Todo documento nasce **Em análise**.  
- O status é livre: o administrador pode voltar um documento deferido ou indeferido para Em análise, ou vice-versa.  
- Não há aprovação automática: nada muda de status sozinho.  
- A exclusão é definitiva e não pode ser desfeita.  
- **O mesmo arquivo não pode ser enviado duas vezes**: o sistema identifica o conteúdo do arquivo e recusa envios duplicados, informando falha no processamento. Na prática, é preciso enviar o documento com arquivo diferente (por exemplo, uma nova versão exportada).  
**6.3 Ciclo de vida da conta**  
[cadastro] → [e-mail de confirmação enviado] → [aguardando verificação] → [conta verificada] ⇄ [login ativo]  
                                                 │                            │  
                                                 └─ reenvio a cada 5 min     └─ troca/redefinição de senha  
                                                    (login bloqueado)            (outras sessões encerradas)  
   
- Conta sem e-mail verificado **não consegue entrar**.  
- Cadastro não deixa o usuário logado.  
- Senha redefinida **desconecta as sessões abertas em outros dispositivos**.  
- E-mail pode ser alterado pelo próprio usuário **sem nova verificação**.  
- Nome restrito a 5–20 letras; e-mail único no sistema.  
- Datas de criação da conta e de cadastro das empresas são exibidas formatadas (dia/mês/ano).  
**6.4 Ciclo de vida da empresa (processo)**  
[cadastro] → [ativa no painel] → [editável] → [excluída]  
                   ↕  
      [altera de natureza entre RJ e Falência]  
   
- A **natureza** define a aba em que o processo aparece e não pode ser outra além de Recuperação Judicial ou Falência.  
- A exclusão da empresa **remove também os documentos vinculados** a ela.  
- Todos os campos do cadastro são obrigatórios; o protocolo é uma data.  
- O número do processo aceita apenas letras, números, ponto, hífen e barra (até 50 caracteres).  
**6.5 Limites, cotas e frequências**  
| | |  
|-|-|  
| **Limite** | **Valor** |   
| Contas criadas por endereço de rede | **5** |   
| Intervalo para reenviar a verificação de e-mail | **5 minutos** por usuário |   
| Pedidos de reenvio de verificação | **6 por minuto** |   
| Tamanho máximo de documento enviado | **40 MB** (verificado antes do envio) |   
| Envios simultâneos | **3 arquivos por vez** |   
| Documentos por página na lista de um cliente | **10** |   
| Tamanho máximo da foto de perfil | **2 MB** (com aviso antecipado acima de 5 MB) |   
| Validade do link de confirmação de e-mail | Temporária (o link expira) |   
| Validade do link de redefinição de senha | Temporária (o link expira) |   
| Tamanho máximo de senha / nome / e-mail | senha ≥ 8 caracteres; nome 5–20; e-mail até 255 |   
   
**6.6 Efeitos colaterais das remoções**  
| | |  
|-|-|  
| **Ação** | **Efeitos** |   
| **Excluir documento** | Some o documento e o arquivo correspondente |   
| **Excluir cliente** | Some o usuário, **todos os seus documentos e arquivos**, e a foto de perfil |   
| **Excluir empresa** | Some a empresa e **todos os seus documentos** |   
| **Excluir administrador** | **Não permitido** pelo sistema |   
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNhwgJuUPYDMpnRgQU2QtIq6DIze3UGAMBf3Gu1VcfXEwAAXrseaHEEM+cJoFcAAAAASUVORK5CYII=)  
**7. Integrações perceptíveis ao usuário**  
- **E-mail:** base de toda a comunicação do sistema — confirmação de cadastro, redefinição de senha e aviso de novo documento enviado (destinatário interno fixo da administração judicial). As falhas de envio de notificação não interrompem o uso do sistema.  
- **Armazenamento e entrega de arquivos:** documentos e fotos de perfil são enviados pelo usuário e devolvidos pelo sistema; o comportamento muda conforme o formato (abertura no navegador ou download). O tamanho e o formato do arquivo influenciam a experiência.  
- **Navegador do usuário:** os documentos abrem sempre em nova aba, e a tela se adapta ao dispositivo usado (computador ou celular).  
- **Canais de atendimento:** telefone, e-mail de contato e endereço com acesso direto ao mapa, disponíveis na apresentação e no rodapé.  
- **Calendário/sistema do usuário:** os campos de data (protocolo do processo) usam o seletor de data do navegador e são exibidos em formato brasileiro.  
- **E-mail do credor como identificador de acesso:** toda a autenticação, a recuperação de senha e a verificação de conta dependem do e-mail informado.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OMQ2AABAAsSPBCj5fFgpQwYwEZiywEZJWQZeZ2ao9AAD+4lyruzq+ngAA8Nr1AMTRBeEgNK9YAAAAAElFTkSuQmCC)  
**8. Navegação e elementos globais de interface**  
- **Cabeçalho fixo** com a marca do escritório, links de navegação e o  **menu do usuário** (nome, foto ou ícone de pessoa).  
- **Links do cabeçalho por perfil:**  
  - Visitantes: acesso ao login.  
  - Credores: página inicial do portal.  
  - Administradores: página inicial do portal e **Empresas** (cadastro de processos).  
- **Menu do usuário:** acesso ao  **Menu** (minha conta) e à ação  **Sair**.  
- **Foto de perfil** no cabeçalho, substituindo o ícone de pessoa quando há imagem.  
- **Menu hambúrguer** para telas estreitas, que recolhe os itens de navegação em um painel expansível.  
- **Botão “VOLTAR”** nas telas de detalhe (empresa e documentos do cliente), retornando ao painel.  
- **Ícones identificadores** para cada natureza de documento, perfil (administrador/cliente) e estado (público/privado, deferido/indeferido/em análise).  
- **Responsividade:** a interface adapta-se a telas menores com menu recolhível e layouts em coluna única.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAUBBAwSd8bOHVnBvBkAaxgjcRZhLMNjNHdQUAwF/cq9qr8+sJAACvrQctgQNH4A++9QAAAABJRU5ErkJggg==)  
**9. Validações funcionais consolidadas**  
**Conta e autenticação**  
- **Nome:** obrigatório; 5 a 20 caracteres; apenas letras (com acentuação).  
- **E-mail:** obrigatório; formato válido; único no sistema; até 255 caracteres; gravado em minúsculas.  
- **Senha:** obrigatória; mínimo de 8 caracteres; ao menos uma maiúscula, uma minúscula, um número e um caractere especial entre @ $ ! % * ? &; confirmação obrigatória e idêntica.  
- **Troca de senha:** exige senha atual correta; nova senha não pode ser igual à atual.  
- **Login:** exige e-mail e senha; só passa quem tem e-mail verificado.  
- **Contas por endereço de rede:** máximo de 5.  
**Perfil**  
- **Foto:** JPG/JPEG/PNG; até 2 MB; deve ser uma imagem.  
- **Nome e e-mail:** mesmas regras da conta; e-mail único.  
**Empresas**  
- **Todos os campos obrigatórios**; textos até 300 caracteres;  **número do processo** até 50 caracteres, apenas letras, números, ponto, hífen e barra;  **protocolo** é uma data;  **natureza** limitada a Recuperação Judicial ou Falência.  
**Documentos**  
- **Arquivo:** PDF, JPEG, JPG, PNG, DOCX ou XLSX; até 40 MB.  
- **Nome do documento:** obrigatório; até 255 caracteres.  
- **Descrição:** até 1000 caracteres.  
- **Tipo:** obrigatório; quando “Outros”, a especificação é obrigatória.  
- **Empresa:** obrigatória e existente.  
- **Conteúdo do arquivo:** não pode ser idêntico ao de um documento já enviado.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OMQ2AABAAsSNBCUpfDq4wwIAABiywEZJWQZeZ2ao9AAD+4liruzq/ngAA8Nr1ABweBgdur/QFAAAAAElFTkSuQmCC)  
**10. Restrições, lacunas e comportamentos notáveis**  
Registrados aqui para evitar surpresas e orientar melhorias futuras:  
1. **O administrador não vê, na página da empresa, os documentos enviados por credores** — a listagem de uma empresa mostra a ele apenas os documentos enviados por administradores. O acesso direto ao arquivo, porém, é permitido.  
2. **O mesmo arquivo não pode ser enviado duas vezes.** Enviar um arquivo idêntico a outro já enviado faz o envio falhar; é preciso enviar uma versão diferente.  
3. **Credor não visualiza botão de excluir na página da empresa.** A permissão de excluir o próprio documento existe, mas o botão só aparece nas telas de gestão, acessíveis a administradores.  
4. **A exclusão de clientes remove em cascata todos os documentos e a foto de perfil** — não há como recuperar os arquivos enviados.  
5. **A exclusão de empresa remove em cascata todos os documentos vinculados.**  
6. **Não há histórico de alterações de status**, nem trilha de auditoria visível ao usuário: o status é sobrescrito e o valor anterior só aparece momentaneamente na tela, antes de salvar.  
7. **O campo “Autor” do processo é obrigatório no cadastro, mas não é exibido na página da empresa.**  
8. **As estatísticas da tela de documentos do cliente refletem a página de resultados exibida**, e não o total histórico do cliente.  
9. **Trocar o e-mail no perfil dispensa nova verificação de e-mail.**  
10. **Não há autoexclusão de conta nem interface de gestão de contas** (editar o perfil de outro usuário, redefinir a senha de terceiros, promover alguém a administrador).  
11. **Não há mecanismo de notificação ao credor sobre a decisão (deferimento/indeferimento)** — o credor precisa consultar periodicamente a empresa para ver o novo status.  
12. **Recuperação de senha apenas por e-mail**; não há suporte por telefone ou atendimento presencial dentro do sistema.  
13. **O envio de documentos é sempre vinculado a uma empresa pré-selecionada**; não há uma tela única para enviar para várias empresas de uma vez.  
14. **Não há visualização de documentos em miniatura, download em lote nem busca por conteúdo de documento** — apenas por nome de empresa, número de processo, cliente e tipo.  
15. **O login não apresenta bloqueio por tentativas sucessivas.** O único limite existente é o de  **5 contas por endereço de rede** no cadastro.  
16. **Existem funcionalidades prontas mas ainda não expostas ao usuário**, que podem ser reativadas ou descartadas em revisões futuras: compartilhamento de link de documento por botão; telas em formato de tabela para remoção em massa de usuários e empresas (hoje a remoção é feita pelo menu de cada cartão do painel); um botão de envio de documentos mantido desativado na página da empresa; e filtros por tipo de natureza e por empresa específica no painel, hoje comentados/ocultos.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSPBCj5fFyM6mJHAjAU2QtIq6DIzW7UHAMBfnGt1V8fXEwAAXrsexOEF35f1aEgAAAAASUVORK5CYII=)  
**11. Resumo por perfil: o que cada um pode fazer**  
**Visitante (sem cadastro)**  
- Ler a apresentação e saber o que o portal oferece.  
- Criar conta, recuperar senha e verificar o e-mail.  
- Navegar pelo painel e localizar empresas em Recuperação Judicial e Falência.  
- Buscar empresas por nome ou número de processo.  
- Abrir a página de uma empresa, ver o processo e as observações.  
- Ler **apenas os documentos públicos**.  
**Credor (conta comum verificada)**  
- Tudo o que o visitante faz.  
- Enviar um ou vários documentos por empresa, com tipo, nome, descrição e arquivo.  
- Filtrar a lista de documentos entre “todos”, “meus” e “dos administradores”.  
- Acompanhar o status de cada documento enviado (em análise / deferido / indeferido).  
- Atualizar foto, nome, e-mail e senha; sair da conta.  
- Manter seus dados cadastrais atualizados (requisito do próprio portal).  
**Administrador**  
- Tudo o que o credor faz.  
- Cadastrar, editar e excluir **empresas** (processos), definindo natureza, vara, juiz, protocolo, autor e observações.  
- Ver a aba **Clientes** e navegar por todos os usuários, com busca por cliente e por empresa vinculada.  
- Abrir a lista de documentos de qualquer cliente, com indicadores por status e paginação.  
- **Alterar o status** dos documentos, em lote, e salvar as alterações.  
- **Alternar a visibilidade** dos documentos entre público e privado.  
- **Excluir documentos** de qualquer usuário.  
- **Excluir clientes** (com remoção em cascata dos documentos e da foto).  
- Fazer a administração judicial receber, por e-mail, o aviso de cada novo documento adicionado ao sistema.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsSfYxZo/khWsYQLPJrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4qjBdKlX6OKAAAAAElFTkSuQmCC)  
*Documento de inventário funcional. Descreve o comportamento percebido pelo usuário do Portal do Credor da Case Administração Judicial, sem detalhar a forma como cada parte foi construída.*  
