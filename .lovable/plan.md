

## Plano: Separar tarefas concluídas em seção colapsável

### O que muda
Na página de Tarefas, as tarefas concluídas (checkbox marcado) serão movidas para uma seção separada com um botão de expandir/colapsar, iniciando fechada. Assim, o foco fica nas tarefas pendentes.

### Implementação

**Arquivo: `src/pages/TasksPage.tsx`** — componente `TasksContent`

1. Separar o array `sorted` em dois: `pending` (não concluídas) e `completed` (concluídas)
2. Renderizar primeiro a lista de pendentes normalmente
3. Abaixo, adicionar uma seção colapsável:
   - Botão: **"Concluídas (X)"** com ícone ChevronDown/ChevronUp
   - Estado `showCompleted` (default `false`)
   - Quando aberto, mostra a lista de tarefas concluídas
4. Aplicar a mesma lógica no componente `ClientTasks` (`src/components/ClientTasks.tsx`)

### Visual
- Botão discreto com contagem, estilo similar aos toggles já existentes no app
- Separador visual sutil entre pendentes e concluídas

