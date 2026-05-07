import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import webpush from 'https://esm.sh/web-push@3.6.7';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;

webpush.setVapidDetails(
  'mailto:contato@pontogo.app',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Timezone Brasília (UTC-3)
    const now = new Date();
    const brTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const currentHour = brTime.getHours();
    const currentMin = brTime.getMinutes();
    const today = brTime.toISOString().split('T')[0];
    const dayOfWeek = brTime.getDay(); // 0=Dom, 1=Seg...

    // 2. Busca otimizada (Nested Select)
    // Buscamos perfis que tenham inscrições push ativas
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select(`
        id, 
        jornada, 
        lembrete_config, 
        dias_trabalho,
        registros(data, entrada, saida),
        push_subscriptions(endpoint, p256dh, auth)
      `)
      .eq('registros.data', today);

    if (pError) throw pError;
    if (!profiles) return new Response(JSON.stringify({ success: true, count: 0 }));

    let notificationCount = 0;

    for (const profile of profiles) {
      const subs = profile.push_subscriptions || [];
      if (subs.length === 0) continue;

      const isDiaTrabalho = profile.dias_trabalho?.includes(dayOfWeek);
      const registroHoje = profile.registros?.[0] || null;
      const config = profile.lembrete_config;

      let title = '';
      let body = '';

      // --- Lógica de Lembretes Diários ---
      if (isDiaTrabalho && config) {
        // Entrada (08:30)
        if (config.entrada && !registroHoje?.entrada && currentHour === 8 && currentMin >= 30 && currentMin < 35) {
          title = 'Bom dia!';
          body = 'Não esqueça de bater o ponto de entrada.';
        }
        // Saída (17:30)
        else if (config.saida && registroHoje?.entrada && !registroHoje?.saida && currentHour === 17 && currentMin >= 30 && currentMin < 35) {
          title = 'Jornada terminando';
          body = 'Não esqueça de bater o ponto de saída!';
        }
      }

      // --- Lógica de Resumo Semanal (Segunda-feira 09:00) ---
      if (dayOfWeek === 1 && currentHour === 9 && currentMin >= 0 && currentMin < 5) {
        // Nota: O resumo semanal poderia buscar dados do banco aqui, 
        // mas para manter a performance nesta função de massa, 
        // poderíamos enviar uma mensagem genérica ou disparar outra função.
        // Vamos enviar um incentivo para checar o histórico.
        title = 'Resumo da Semana Disponível';
        body = 'Confira como foi seu saldo de horas na semana passada no seu histórico.';
      }

      if (title && body) {
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
              },
              JSON.stringify({ title, body, url: '/#historico' })
            );
            notificationCount++;
          } catch (err) {
            if (err.statusCode === 410) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, notificationsSent: notificationCount }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
