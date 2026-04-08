

## Plano: Adicionar campo de dificuldade às tarefas

### O que muda
Cada tarefa passa a ter um nível de dificuldade (fácil, média, difícil) selecionável na criação. Na listagem, aparece como um pequeno badge colorido ao lado da data.

### Etapas

**1. Migração no banco de dados**
- Adicionar coluna `difficulty` (text, nullable, default `null`) na tabela `tasks`
- Valores possíveis: `'facil'`, `'media'`, `'dificil'`

**2. Atualizar tipo TypeScript**
- `src/lib/types.ts`: adicionar `difficulty?: 'facil' | 'media' | 'dificil'` ao `Task`

**3. Atualizar store**
- `src/lib/store.tsx`: incluir `difficulty` no `mapTask`, no `addTask` (insert), e na leitura

**4. Formulário de criação (ambos os locais)**
- `src/pages/TasksPage.tsx` — `NewTaskForm`: adicionar seletor de dificuldade com 3 botões (Fácil / Média / Difícil)
- `src/components/ClientTasks.tsx` — formulário inline: mesmo seletor

**5. Visualização na lista de tarefas**
- Em ambos `renderTask`, exibir um badge pequeno com cor:
  - Fácil → verde
  - Média → amarelo/laranja  
  - Difícil → vermelho
- Badge posicionado entre o nome do cliente e a data, discreto (text-[10px])

