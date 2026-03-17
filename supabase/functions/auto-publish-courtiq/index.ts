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

    // Calculate exact hour boundaries (no milliseconds - prevents race condition duplicates)
    const israelHourStart = new Date(israelTime)
    israelHourStart.setMinutes(0, 0, 0)
    const utcOffset = now.getTime() - israelTime.getTime()
    
    // Use exact second-level precision for publish_at and expires_at
    const publishAt = new Date(israelHourStart.getTime() + utcOffset)
    publishAt.setMilliseconds(0)
    const expiresAt = new Date(publishAt.getTime() + 55 * 60 * 1000) // 55 minutes
    expiresAt.setMilliseconds(0)

    // Check if there's already ANY non-pool question published in this hour window
    // Use a wider check: any question with publish_at in the same UTC hour
    const hourWindowStart = new Date(publishAt)
    hourWindowStart.setMinutes(0, 0, 0)
    const hourWindowEnd = new Date(hourWindowStart.getTime() + 60 * 60 * 1000)

    const { data: activeQ } = await supabase
      .from('courtiq_questions')
      .select('id')
      .neq('status', 'pool')
      .gte('publish_at', hourWindowStart.toISOString())
      .lt('publish_at', hourWindowEnd.toISOString())
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

    // Update with exact timestamps
    const { error, data: updated } = await supabase
      .from('courtiq_questions')
      .update({
        status: 'scheduled',
        publish_at: publishAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', questionId)
      .eq('status', 'pool') // Only update if still in pool (prevents race condition)
      .select('id')

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If no rows were updated, another instance already published
    if (!updated || updated.length === 0) {
      return new Response(JSON.stringify({ message: 'Race condition avoided - another instance already published' }), {
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