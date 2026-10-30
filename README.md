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
- Fins de semana e feriados (nacionais, PE e Recife) em rosa; Natal/Réveillon, Carnaval e Semana Santa em lilás; hoje com contorno dourado.

## Publicação

Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions** (uma única vez).

## Estrutura

```
index.html                 layout da escala
css/escala.css             estilos do design (inclui regras de impressão)
css/tokens/                tokens do design system JRS/HNRe (cores, tipografia, Montserrat)
js/escala.js               calendário, feriados, sincronização e exportação PDF
js/snapshot.js             cópia local da aba AGENDA (fallback)
scripts/gerar_snapshot.py  regenera o snapshot
assets/                    brasão, rubrica e fontes
```
