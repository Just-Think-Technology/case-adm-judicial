# Nielsen Heuristics — Development Rule

Every UI change (new screen, flow or component) must be checked against the 10
Nielsen heuristics before merge. This file is the authoritative checklist; the
PR carries the per-heuristic evidence (screenshot or short recording of the flow
for each profile).

## Checklist (PT-BR)

1. **Visibilidade do status do sistema** — loading with `aria-busy`,
   success/error notifications, **empty state** for every list
   (empresa sem documento, cliente sem documento, busca sem resultado), progress
   bar on document upload, "salvando..." state on batch status save
2. **Correspondência com o mundo real** — termos do domínio judicial em PT-BR
   (*Recuperação Judicial*, *Falência*, *Habilitação de crédito*, *Divergência
   de crédito*, *Habilitação ACG*, *Deferido*, *Indeferido*, *Em análise*),
   datas em `dd/mm/aaaa`, tamanhos de arquivo legíveis; nada de nome técnico de
   status ou de chave interna na tela
3. **Controle e liberdade** — botão **VOLTAR** em toda tela de detalhe, **CANCELAR**
   ao lado de **SALVAR**, confirmação antes de excluir
   ("Esta ação não pode ser desfeita"), desfazer o filtro sem perder a busca
4. **Consistência e padrões** — um CTA por tela, mesma ordem de ações
   (abrir → status → visibilidade → excluir), rótulos de botão iguais em todas
   as telas, selos de status/visibilidade com a mesma cor e o mesmo texto
5. **Prevenção de erros** — botão desabilitado enquanto o pré-requisito falta,
   validação de formato/tamanho de arquivo antes do envio, requisitos de senha
   verificados em tempo real, confirmação em toda ação destrutiva
6. **Reconhecimento em vez de memorização** — nome da empresa e número do
   processo sempre visíveis no cartão e no cabeçalho da tela de documentos,
   rótulo do tipo de documento, tooltip no botão de visibilidade
   ("Tornar público" / "Tornar privado")
7. **Flexibilidade e eficiência** — busca por nome/número de processo/email
   sem clicar, filtro de documentos (todos / meus / dos administradores),
   envio de vários documentos de uma vez, tabela paginada do cliente
8. **Estética e design minimalista** — sem ruído: dados secundários em bloco
   "OBS/AVISOS", ícones com rótulo textual quando o ícone sozinho não
   comunica, hierarquia clara entre o caso e seus documentos
9. **Auxílio no diagnóstico** — mensagens de erro acionáveis e em PT-BR
   ("verifique o tamanho do arquivo", "a nova senha deve conter…",
   "e-mail já cadastrado no sistema"), nunca stack trace ou erro interno cru
10. **Ajuda e documentação** — link de contato (`contato@caseadmjudicial.com.br`,
    telefone) na apresentação e no rodapé, aviso de "verifique o spam" após o
    cadastro e o reenvio de verificação, requisitos de senha acessíveis em um
    pop-up

## Evidence in the PR

- Checklist 10/10 with a short evidence line per heuristic
- Screenshots/recording of the flow per profile (guest, credor, admin)
- When a heuristic is partially met: the problem, its severity (0–4) and the
  follow-up issue or the reason for deferring

## When to apply

- Any new screen, flow or component; any change that alters a user's path,
  a permission-gated affordance, a status/visibility label or a user-facing
  message
- PR checklist: `[ ] 10 heurísticas` + `[ ] loading/empty/error/success` +
  `[ ] perfis (guest, credor, admin)` — blocked if missing
