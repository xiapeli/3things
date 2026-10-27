# 3things

Três prioridades por semana, com marcos, OKRs, backlog, histórico e revisão. Interface em pt-BR, local-first e sem Base44.

O produto oficial é um **app para Mac**. Este repositório também permite executar a mesma interface **localmente no navegador**. Não existe app web oficial hospedado pelo hooks.cool.

## Executar no navegador

Requisitos: Node.js 22+ e pnpm 10+.

```sh
pnpm install
pnpm dev
```

Abra `http://localhost:5183`. Os dados ficam no `localStorage` desse navegador.

## Executar no Mac

Requisitos adicionais: Rust/Cargo e Xcode Command Line Tools.

```sh
pnpm install
pnpm tauri dev
```

Para gerar o app e o DMG localmente:

```sh
pnpm tauri build
```

Os artefatos ficam em `src-tauri/target/release/bundle/`. A configuração pública não inclui identidade de assinatura. Para distribuir builds assinados, configure sua própria identidade Apple Developer em `src-tauri/tauri.conf.json` e o fluxo de notarização correspondente.

## Dados, conta e privacidade

- O app funciona sem conta e permanece útil offline.
- Sem login, prioridades, OKRs, backlog e perfil ficam somente no dispositivo.
- Com login opcional pela conta hooks.cool, os dados são sincronizados com a área privada da pessoa usando HTTPS.
- A sincronização não é criptografia de ponta a ponta.
- No app Mac, o token da sessão fica no Keychain, nunca no `localStorage`, backup ou logs.
- O backup JSON pode ser exportado/importado em **PERFIL → DADOS** e não contém tokens.
- Conflitos de revisão exigem escolha explícita; edições offline e dados locais não são sobrescritos silenciosamente.

O retorno do login local é permitido somente em `http://localhost:5183`. O app Mac usa o esquema `threethings://` e códigos de autorização de uso único.

## Testes

```sh
pnpm test
pnpm build
cd src-tauri
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-targets --all-features
```

## Stack

React 18, TypeScript, Vite, Tailwind CSS, Tauri 2 e Rust. A fonte Inter é empacotada; a interface não depende de fontes externas.

## Licença

MIT. Veja [LICENSE](LICENSE).
