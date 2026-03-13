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

    if (currentHour < startHour || currentHour >= endHour) {
      return new Response(JSON.stringify({ message: `Outside active hours (${startHour}-${endHour}). Current: ${currentHour}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if there's already an active question right now
    const { data: activeQ } = await supabase
      .from('courtiq_questions')
      .select('id')
      .neq('status', 'pool')
      .lte('publish_at', now.toISOString())
      .gt('expires_at', now.toISOString())
      .limit(1)

    if (activeQ && activeQ.length > 0) {
      return new Response(JSON.stringify({ message: 'Active question already exists', activeId: activeQ[0].id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Pick random pool question
    const { data: poolQuestions } = await supabase
      .from('courtiq_questions')
      .select('id')
      .eq('status', 'pool')

    if (!poolQuestions || poolQuestions.length === 0) {
      return new Response(JSON.stringify({ message: 'No pool questions available' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const randomIndex = Math.floor(Math.random() * poolQuestions.length)
    const questionId = poolQuestions[randomIndex].id

    const publishAt = new Date()
    const expiresAt = new Date(publishAt.getTime() + 55 * 60 * 1000)

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
      message: 'Question published from pool', 
      questionId, 
      publishAt: publishAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      poolRemaining: poolQuestions.length - 1,
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
