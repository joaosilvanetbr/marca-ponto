import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import webpush from 'https://esm.sh/web-push@3.6.7';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;

webpush.setVapidDetails(
  'mailto:contato@pontogo.app',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Pega a hora atual do servidor (UTC) e converte para horário de Brasília (UTC-3)
    // Em uma versão real, deveríamos considerar o timezone de cada usuário.
    const now = new Date();
    const brTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const currentHour = brTime.getHours();
    const currentMin = brTime.getMinutes();
    const today = brTime.toISOString().split('T')[0];

    console.log(`Verificando lembretes para ${today} ${currentHour}:${currentMin}`);

    // 2. Busca todos os perfis e seus registros de hoje
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, jornada, lembrete_config, dias_trabalho');

    if (pError) throw pError;

    for (const profile of profiles) {
      // Verifica se hoje é dia de trabalho
      const dayOfWeek = brTime.getDay();
      if (!profile.dias_trabalho.includes(dayOfWeek)) continue;

      // Busca registro de hoje
      const { data: registro } = await supabase
        .from('registros')
        .select('*')
        .eq('user_id', profile.id)
        .eq('data', today)
        .maybeSingle();

      const config = profile.lembrete_config;
      let title = '';
      let body = '';

      // Lógica de Lembrete simplificada (baseada na hora do sistema)
      // Entrada (ex: se não bateu entrada e é entre 8h e 9h)
      if (config.entrada && !registro?.entrada && currentHour === 8 && currentMin === 30) {
        title = 'Bom dia!';
        body = 'Não esqueça de bater o ponto de entrada.';
      }
      // Saída (ex: se bateu entrada e já se passaram 9h)
      else if (config.saida && registro?.entrada && !registro?.saida && currentHour === 17 && currentMin === 30) {
        title = 'Jornada terminando';
        body = 'Não esqueça de bater o ponto de saída!';
      }

      if (title && body) {
        // Busca inscrições push
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', profile.id);

        if (subs) {
          for (const sub of subs) {
            try {
              await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                  }
                },
                JSON.stringify({ title, body, url: '/' })
              );
              console.log(`Push enviado para ${profile.id}`);
            } catch (err) {
              console.error(`Erro ao enviar push para ${sub.endpoint}:`, err);
              if (err.statusCode === 410) {
                // Inscrição expirada/inválida, remover do banco
                await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
