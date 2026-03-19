import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Get yesterday's date (skip weekends)
    const now = new Date()
    const today = now.getDay() // 0=Sun, 1=Mon...
    
    // If today is Sunday(0) or Monday(1), skip (no report for Sat/Sun)
    if (today === 0 || today === 1) {
      return new Response(JSON.stringify({ message: 'Weekend - no report generated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    const dayLabel = dayNames[yesterday.getDay()]

    // Get all users with profiles
    const { data: profiles } = await supabase.from('profiles').select('user_id, name')
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: 'No users found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let notificationsCreated = 0

    for (const profile of profiles) {
      const userId = profile.user_id

      // Get yesterday's data for this user
      const [reviewsRes, tasksRes, historyRes, notesRes] = await Promise.all([
        supabase.from('reviews').select('*').eq('user_id', userId).eq('date', yesterdayStr),
        supabase.from('tasks').select('*').eq('user_id', userId).eq('due_date', yesterdayStr),
        supabase.from('review_history').select('*').eq('user_id', userId).eq('date', yesterdayStr),
        supabase.from('notes').select('*').eq('user_id', userId).eq('date', yesterdayStr),
      ])

      const reviews = reviewsRes.data || []
      const tasks = tasksRes.data || []
      const history = historyRes.data || []
      const notes = notesRes.data || []

      const doneReviews = reviews.filter((r: any) => r.done).length
      const totalReviews = reviews.length
      const doneTasks = tasks.filter((t: any) => t.done).length
      const totalTasks = tasks.length
      const pendingTasks = totalTasks - doneTasks

      // Build summary
      const parts: string[] = []
      if (totalReviews > 0) parts.push(`Revisões: ${doneReviews}/${totalReviews} concluídas`)
      if (totalTasks > 0) parts.push(`Tarefas: ${doneTasks}/${totalTasks} concluídas`)
      if (pendingTasks > 0) parts.push(`${pendingTasks} tarefa(s) pendente(s)`)
      if (notes.length > 0) parts.push(`${notes.length} anotação(ões)`)
      if (history.length > 0) parts.push(`${history.length} resumo(s) de revisão`)

      if (parts.length === 0) {
        parts.push('Nenhuma atividade registrada')
      }

      const title = `Relatório de ${dayLabel}, ${yesterday.toLocaleDateString('pt-BR')}`
      const body = parts.join(' • ')

      // Check if notification already exists for this day
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'daily_report')
        .gte('created_at', yesterdayStr + 'T23:00:00Z')
        .lte('created_at', now.toISOString())
        .limit(1)

      if (existing && existing.length > 0) continue

      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'daily_report',
        title,
        body,
        data: {
          date: yesterdayStr,
          reviews: { done: doneReviews, total: totalReviews },
          tasks: { done: doneTasks, total: totalTasks },
          notes: notes.length,
          history: history.length,
        },
      })

      if (!error) notificationsCreated++
    }

    return new Response(JSON.stringify({ 
      success: true, 
      notifications_created: notificationsCreated 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error generating daily report:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
