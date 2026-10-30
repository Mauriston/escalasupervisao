# Escala de Supervisão Médica do SPA · HNRe

Página estática (GitHub Pages) com a escala mensal de supervisão do SPA do Hospital Naval de Recife.

## Como os dados se atualizam

- A página lê **ao vivo** a aba `AGENDA` (colunas `DATA`, `DIA`, `SVÇ`, `RETÉM`) da planilha
  `1iUXf6HYi_tIuOflN1kuCsLddUbpwIwu7S6KGYZrJSws` ao abrir, a cada 5 min e sempre que a aba volta ao foco.
  Basta editar a planilha; não é preciso novo deploy.
- A planilha precisa continuar compartilhada como **"Qualquer pessoa com o link: leitor"**.
- `js/snapshot.js` é uma cópia local usada só se a planilha não responder. O workflow
  `.github/workflows/pages.yml` a regenera a cada deploy (push na `main` e diariamente).

## Uso

- `‹` / `›` ou os seletores mudam o mês (o último mês escolhido fica salvo no navegador).
- Clique no **brasão** para baixar a escala em PDF (A4 paisagem). `Ctrl+P` também gera uma versão de impressão.
- O mesmo clique salva uma cópia do PDF na pasta do Google Drive configurada em `apps-script/Code.gs`.
  Se já houver PDF do mesmo mês na pasta (ex.: `OUT2026` no nome), ele vai para a lixeira e é substituído.
- Fins de semana e feriados (nacionais, PE e Recife) em rosa; Natal/Réveillon, Carnaval e Semana Santa em lilás; hoje com contorno dourado.

## Publicação

Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions** (uma única vez).

## Cópia do PDF no Google Drive (configuração única)

1. Em https://script.google.com, crie um projeto (ex.: "Escala SPA · PDF no Drive") e cole o conteúdo de
   `apps-script/Code.gs`. Em Configurações do projeto, marque "Mostrar appsscript.json" e cole `apps-script/appsscript.json`.
2. **Implantar → Nova implantação → App da Web**, com *Executar como: Eu* e *Quem pode acessar: Qualquer pessoa*.
   Autorize o acesso ao Drive quando solicitado.
3. Copie a URL que termina em `/exec` e coloque em `DRIVE_ENDPOINT` no início de `js/escala.js`.

Enquanto `DRIVE_ENDPOINT` estiver vazio, o clique apenas baixa o PDF. Ao alterar o `Code.gs`, publique uma
nova versão em **Implantar → Gerenciar implantações → Editar → Nova versão**; assim a URL continua a mesma.

## Estrutura

```
index.html                 layout da escala
css/escala.css             estilos do design (inclui regras de impressão)
css/tokens/                tokens do design system JRS/HNRe (cores, tipografia, Montserrat)
js/escala.js               calendário, feriados, sincronização e exportação PDF
js/snapshot.js             cópia local da aba AGENDA (fallback)
scripts/gerar_snapshot.py  regenera o snapshot
apps-script/               Web App que grava o PDF no Google Drive
assets/                    brasão, rubrica e fontes
```
