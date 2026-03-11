# MEMÓRIA DE PROJETO: CODEBASE DEEP ANALYSIS — KOZEGHO SALES APP

---

## 1. Mapa do Projeto (Visão Geral)
A Kozegho Sales App é uma aplicação Single Page Application (SPA) construída de forma modular para uma equipa comercial (CRM + Faturação Simplificada).

### Estrutura de Pastas e Responsabilidades
- **Raiz (`/`)**: 
  - `App.tsx`: Ponto de entrada das rotas (via `react-router-dom`) e o wrapper de Autenticação (`ProtectedRoute`).
  - `types.ts`: Modelos de dados globais tipados TypeScript (`Cliente`, `Proposta`, `Produto`, etc.).
  - `vercel.json`: Preparação para deploy Vercel com SPA rewrite rule.
- **`/pages`**: Componentes orquestradores das páginas (`CreateProposal.tsx`, `Dashboard.tsx`, `ProposalDocument.tsx`, `Login.tsx`).
- **`/components`**: Componentes visuais isolados (`AppLayout` para a barra lateral, `ProposalPreview.tsx` para o template HTML da proposta).
- **`/services`**: Lógica de negócio e acesso a dados.
  - `api.ts`: Proxy exportador que resolve qual backend está ativo.
  - `api.supabase.ts`: Comunicação real com a base de dados (cliente do Supabase).
  - `documentGenerator.ts`: Funções para mapear os dados da app para o modelo a injetar no HTML da proposta.
  - `pricing.ts`: Cálculos financeiros centrais.
- **`/contexts`**:
  - `AuthContext.tsx`: Gere a sessão de utilizador e interface com Supabase Auth.
- **`/supabase`**:
  - `schema.sql`: Definição de tabelas, triggers e RLS (Row Level Security) da base de dados oficial.

### Dependências Principais (`package.json`)
- **React 19 + Vite**: O motor e bundler moderno super rápido.
- **@supabase/supabase-js**: Cliente de Backend as a Service para Auth, Record Management e Realtime.
- **Tailwind CSS v4 + Lucide React**: Para styling utility-first e ícones profissionais SVG.
- **@google/genai**: Biblioteca para ajudar na formulação/geração via inteligência artificial (e.g., draftar emails do documento).

---

## 2. Mapa de Fluxos (Negócio e Técnico)

### A. Fluxo de Autenticação
1. **Componente**: `Login.tsx` recolhe credenciais.
2. **Contexto**: `AuthContext.tsx` chama `supabase.auth.signInWithPassword`.
3. **Persistência**: O Supabase trata dos tokens (localStorage). No load, o listener de estado `ensureProfile` garante que o utilizador autenticado tem a sua conta sincronizada na tabela `profiles`.
4. **Guards**: `ProtectedRoute` no `App.tsx` impede acesso a /dashboard ou outras rotas caso `isAuthenticated` retorne false.

### B. Fluxo Principal: Criar e Exportar Proposta
**Sequência Funcional e Técnica (Criar Proposta -> Exportar):**

1. `UI (CreateProposal.tsx)`: O comercial altera cliente (`handleCreateClient`), introduz artigos (`handleAddLine` vs `productCatalog.ts`), altera descontos globais.
2. O state gere o estado num array de `linhas` e totais atualizados on-the-fly (`services/pricing.ts`).
3. Ao clicar em "Guardar", `buildProposalObject` constrói o JSON.
4. É executada a API (`api.supabase.ts` -> `saveProposta`): a proposta e as linhas/opções são introduzidas nas tabelas `proposals`, `proposal_lines` e `proposal_line_options`.
5. Redirecionamento para `ProposalDetail.tsx` (vista geral).
6. O comercial clica em "Generate Document", e transita para a rota `/proposal/:id/document` (`ProposalDocument.tsx`).
7. **No UI do Documento**: É invocado o componente pure-HTML `ProposalPreview.tsx`. Do preview pode disparar Impressão nativa (`window.print()`) ou geração de mail com prompt de IA (`generateEmailBodyAI`).

**Componentes e APIs envolvidos no Fluxo:**
| Rota/Ação | Componente | Ação | API/DB |
| --- | --- | --- | --- |
| `/create` | `CreateProposal.tsx` | UI input de artigos, cliente e calc de totais | `api.ts` -> fetch clients e catalog |
| Salvar Proposta | `CreateProposal.tsx` | Submit State (`buildProposalObject`) | `API: supabaseApi.saveProposta` -> insere na DB (`proposals`) |
| `/proposal/:id/doc`| `ProposalDocument.tsx`| Ver Documento Final e gerar HTML render | `API: supabaseApi.getPropostaById` -> traz dados via Supabase |
| Enviar por email | `ProposalDocument.tsx`| Gera texto de email com Gemini AI | `API: supabaseApi.generateEmailBodyAI` |

---

## 3. Modelo de Dados (Supabase Inferido)

O `schema.sql` evidencia um sistema já concebido como **Multi-Tenant (SaaS)**, focado em agrupar informações por Entidade Empregadora do Comercial (`org_id`).

| Entidade | Campos Relevantes | Observações / Regras de Negócio |
| --- | --- | --- |
| `organizations` | `id`, `name`, `owner_id` | Isolação de tenants. |
| `profiles` | `id`, `org_id`, `role` | `role` in ('admin', 'manager', 'sales', 'viewer'). |
| `customers` | `status`, `market`, `language` | Integra os leads CRM + clientes finais. |
| `proposals` | `status`, `subtotal`, `total`, `valid_until` | Acolhe todas as regras financeiras que já foram computadas no frontend pelo `pricing.ts`. Campos `doc_url` e `pdf_url` preparados para futuro. |
| `proposal_lines` | `unit_price`, `discount_percent` | Liga-se a `proposals` (`on delete cascade`). Detalhe de preços de modelo. |
| `audit_logs` | `actor_id`, `action`, `entity_type` | Tabela nativa para Rastreio (Ex: rastreamento de alterações e aprovações). |

**Gaps a preencher no Modelo:**
- Template de Branding (logotipo, cores) por `org_id` não existe no schema.
- Registo de Várias versões / Histórico físico da proposta não estruturado (hoje só edita por cima).

---

## 4. Document Generation Readiness (Auditoria Específica)

**Estado Atual:**
A funcionalidade **existe apenas como UI client-side (HTML/CSS)** dentro de `ProposalPreview.tsx`. O botão "Generate PDF" hoje em dia invoca um `window.print()` — que obriga o humano a guardar como PDF à mão, sujeitando-se às margens maradas do Chrome/Safari. 

**Onde implementar a Geração do PDF "Enviável"? (Duas Abordagens):**

1. **Abordagem A (Client-Side - Ex: `jsPDF` / `html2canvas` ou `@react-pdf/renderer`)**
   - *Pros:* Zero custos de servidor extra, super rápido.
   - *Cons:* Péssima consistência visual de Browser para Browser; pesadelo para o comercial usar no telemóvel as fonts não mapeiam perfeitamente CSS flex/grid grids modernos.
2. **Abordagem B (Server-Side - Ex: Vercel Function Serverless com Puppeteer / Supabase Edge Functions com pdf-lib ou Browserless.io)**
   - *Pros:* Controlo exato píxel-a-píxel. Gera ficheiro PDF 100% oficial. Ficheiro é depositado num Bucket no Supabase Storage e um Link é gerado automático e enviado para a app e enviado para o email do cliente (Webhook).
   - *Cons:* Necessário configurar Edge Computing (limites minúsculos de MBs, pelo que pode requerer bypass para serviço externo como *browserless* ou API Route Next.JS/Vercel standard).

**Recomendação Exclusiva:** 
Dado o deploy ser via Vercel, o melhor caminho no projeto React/Vite (SPA) mantendo Vercel, é **criar uma `/api/generate-pdf` via Vercel Functions** que utilizará `@sparticuz/chromium` para "tirar screenshot" da preview ou usar uma framework como `@react-pdf/renderer` renderizado no servidor. Esta API fará o Upload para o **Supabase Storage** da tenant correspondente na hora de gravar, guardando o Blob URL em `proposals.pdf_url`. O Frontend passa a ter botão "Download Oficial" que atinge o CDN.

---

## 5. Multi-user & Access for Sales Team

Segundo a auditoria ao código:
- **Auth Flow:** Está perfeito, baseado em Supabase Auth e sessão integrada no contexto `AuthContext.tsx`. O upsert no ficheiro para gerar a conta na tabela `profiles` já existe.
- **RBAC e Permissões:** O enum `role ('admin', 'manager', 'sales', 'viewer')` existe na DB.
- **RLS (Row Level Security):** O `schema.sql` contempla RLS por Organizacional (`org_id`). 

**O grande aspeto vulnerável (Gaps de Implementação e Risco):**
Atualmente, as políticas RLS (`create policy "proposals_modify_org_members" ... using (org_id = current_org_id())`) verificam as empresas, mas **DÃO CARTA BRANCA PARA ALTERAR/APAGAR** a quem passa o filtro. Qualquer comercial (role='viewer' ou 'sales') de uma Org consegue alterar ou aprovar a proposta de outro comercial dessa Org, pois a política está relaxada a "*és do mesmo org_id? então faz update!*".

**Arquitetura de Segurança Recomendada:**
1. Separar o acesso `modify/update` em check duplo: 
   `using (org_id = current_org_id() and (created_by = auth.uid() OR auth.uid() IN (SELECT id form profiles where role='manager'/'admin')))`
2. Forçar Trigger e Function de `audit_logs` no Supabase em todos os UPDATES da tabela de `proposals` para não depender que o Frontend de React faça um dispatch da rotina de log de auditoria.

---

## 6. Plano de Implementação Sugerido

### Fase 1 (MVP Rápido: Geração Assíncrona e Segurança)
- **Tarefa 1. Mudar o botão "CRIAR DOCUMENTO" para Backend** (Tamanho: M).
  - No Supabase Storage, criar um bucket `proposals_docs` com subpastas `/org_id/`.
  - Desenvolver Supabase Edge Function ou Vercel Serverless Function `/api/generate-pdf`.
- **Tarefa 2. Apertar RLS DB** (Tamanho: S).
  - Atualizar ficheiro de schema.sql para os triggers e rules.
  - Bloquear edição de propostas pelos Role=='sales' se campo de 'status'=='Approved'. 

### Fase 2 (Hardening e Otimização Processual)
- **Tarefa 3. Assinatura e Integração Email Serverless** (Tamanho: L).
  - Integrar Sendgrid / Resend via Edge Functions para abolir o atual "mailto:", de forma ao documento PDF ser mandado atachado nativamente dentro do Sendgrid via backend.
- **Tarefa 4. Template Engine Vário** (Tamanho: M)
  - Abstrair o `<ProposalPreview />` permitindo no `organizations` colocar logo e cores em variações.

---

## 7. Checklist de Perguntas Pós-Análise P/ Stakeholder e Donos Do Projeto

Antes de picar código no backend ou fechar PDFs, as seguintes decisões negociais vão ditar arquitetura:

1. A proposta vai necessitar de **Termos de Retoma e Condições Legais Dinâmicas** (páginas estáticas de texto por país/idioma de anexo) nos PDFs gerados?
2. A proposta precisa de **Numeração Fiscal rigorosa/sequencial blindada (AT)** (ex: P2026/001), ou é apenas numeração draft de vendas internas sem validade fiscal oficial?
3. Ficará 100% num formato **PDF standard estático** não editável, ou é imperativo existirem exports **DOCX abertos** para o comercial editar de forma ad-hoc fora da tool?
4. Atualmente o fluxo `generateEmailBody` cria texto para um `mailto:`. É objetivo manter isto "simples", ou migrar para disparo silencioso interno a partir da app usando conta SMTP centralizada (com rastreio open/clicks via Resend/SendGrid etc)?
5. Quem tem o papel de **Managers**, aprovam uma proposta na aplicação antes de esta se gerar como Doc Oficial, ou o comercial aprova a própria proposta se tiver margens certas?
6. O conceito que a base de dados tem de `Multi-Tenant` (`org_id` nas organizações) existe porque vamo-nos expandir para ter múltiplas empresas com faturação isolada na mesma conta de servidor de app, ou a organização será sempre uma?
7. O upload da identidade **logo / assinaturas manuais digitalizadas** da equipa é um requisito imediato para ser depositado nos rodapés dos PDFs?
8. Qual deverá ser do modelo estético visual do PDF Final? Há base pre-definida de InDesign para copiar, ou o template web atual (Html de dashboard clean) servirá de cópia idêntica?
9. Queremos guardar os anexos resultantes de PDF em base de dados (que engole GBs e custos de Supabase de Storage no tempo), ou vamos querer integrar com Google Drive / OneDrive API nativamente?
10. Pretende usar URLs gerados dinâmicos e abertos para o Cliente clicar invés de PDF em Anexo?

---
*Assinado: Antigravity Codebase Agent.*
