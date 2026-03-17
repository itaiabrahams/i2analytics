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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check if auto-publish is enabled
    const { data: settings } = await supabase
      .from('courtiq_settings')
      .select('auto_publish_enabled, publish_start_hour, publish_end_hour')
      .limit(1)
      .single()

    if (!settings?.auto_publish_enabled) {
      return new Response(JSON.stringify({ message: 'Auto-publish disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check Israel time
    const now = new Date()
    const israelTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }))
    const currentHour = israelTime.getHours()
    const startHour = settings.publish_start_hour ?? 9
    const endHour = settings.publish_end_hour ?? 22

    if (currentHour < startHour || currentHour > endHour) {
      return new Response(JSON.stringify({ message: `Outside active hours (${startHour}-${endHour}). Current: ${currentHour}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Calculate this hour's window
    const hourStart = new Date(israelTime)
    hourStart.setMinutes(0, 0, 0)
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)

    const utcOffset = now.getTime() - israelTime.getTime()
    const publishAt = new Date(hourStart.getTime() + utcOffset)
    const expiresAt = new Date(hourEnd.getTime() + utcOffset)

    // Check if there's already an active question for this hour
    const { data: activeQ } = await supabase
      .from('courtiq_questions')
      .select('id')
      .neq('status', 'pool')
      .gte('publish_at', publishAt.toISOString())
      .lt('publish_at', expiresAt.toISOString())
      .limit(1)

    if (activeQ && activeQ.length > 0) {
      return new Response(JSON.stringify({ message: 'Question already published for this hour', activeId: activeQ[0].id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // At 22:00, publish a peak question if available
    const isPeakHour = currentHour === 22

    let questionId: string | null = null

    if (isPeakHour) {
      // Try to find a peak question from the pool
      const { data: peakQuestions } = await supabase
        .from('courtiq_questions')
        .select('id')
        .eq('status', 'pool')
        .eq('is_peak', true)

      if (peakQuestions && peakQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * peakQuestions.length)
        questionId = peakQuestions[randomIndex].id
      }
    }

    // If not peak hour or no peak questions, pick regular pool question
    if (!questionId) {
      const { data: poolQuestions } = await supabase
        .from('courtiq_questions')
        .select('id')
        .eq('status', 'pool')
        .eq('is_peak', false)

      if (!poolQuestions || poolQuestions.length === 0) {
        // Fallback: try any pool question
        const { data: anyPool } = await supabase
          .from('courtiq_questions')
          .select('id')
          .eq('status', 'pool')

        if (!anyPool || anyPool.length === 0) {
          return new Response(JSON.stringify({ message: 'No pool questions available' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const randomIndex = Math.floor(Math.random() * anyPool.length)
        questionId = anyPool[randomIndex].id
      } else {
        const randomIndex = Math.floor(Math.random() * poolQuestions.length)
        questionId = poolQuestions[randomIndex].id
      }
    }

    const { error } = await supabase
      .from('courtiq_questions')
      .update({
        status: 'scheduled',
        publish_at: publishAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', questionId)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      message: isPeakHour ? 'Peak question published!' : 'Question published from pool', 
      questionId, 
      publishAt: publishAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      israelHour: currentHour,
      isPeakHour,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})