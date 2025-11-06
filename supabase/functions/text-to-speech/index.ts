import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate input
    const inputSchema = z.object({
      text: z.string().min(1).max(4000),
      voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional().default('alloy')
    });

    const body = await req.json();
    const validation = inputSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: text required (max 4000 chars) and valid voice' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, voice } = validation.data;

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating speech for text length:', text.length);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI TTS error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate speech' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    console.log('Speech generation successful');

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process text-to-speech request' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
