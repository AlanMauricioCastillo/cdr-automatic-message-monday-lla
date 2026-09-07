export default defineComponent({
  name: "Send Discord CDR Notification",
  description: "Sends a weekly CDR notification to Discord with rotating instructors and adds a reaction",
  type: "action",
  props: {
    webhookUrl: {
      type: "string",
      label: "Discord Webhook URL",
      secret: true,
    },
    botToken: {
      type: "string",
      label: "Discord Bot Token",
      secret: true,
    },
  },
  async run({ $ }) {
    const instructores = {
      strood: "<@726943204607262790>",
      eduardo: "<@258770781331390464>",
      alan: "<@417006877487005697>",
      vermis: "<@441698215977549834>",
    };

    const fechaBase = new Date(Date.UTC(2026, 8, 7));
    const ahora = new Date();
    const semanasTranscurridas = Math.floor((ahora.getTime() - fechaBase.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const indice = semanasTranscurridas % 4;

    const cronograma = [
      { cdr: "INMT", instructor: instructores.alan},
      { cdr: "CQB", instructor: instructores.strood },
      { cdr: "INMT", instructor: instructores.eduardo},
      { cdr: "CQB", instructor: instructores.vermis },
    ];

    const tareaSemana = cronograma[indice];

    const anio = ahora.getUTCFullYear();
    const mes = String(ahora.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getUTCDate()).padStart(2, "0");
    const unixTimestamp = Math.floor(new Date(`${anio}-${mes}-${dia}T22:30:00-03:00`).getTime() / 1000);

    // Original message format with instructor mention
    const mensaje = `<@&725410477777354782> ¡ATENCIÓN! CDR de ${tareaSemana.cdr} de la mano del ${tareaSemana.instructor}\n\nHoy <t:${unixTimestamp}:t> (tu hora local) - Reaccionen al mensaje para confirmar asistencia \n\n**NOTA:** Si no llegamos a 4 reacciones de reclutas, el CDR se cancela y se deberá esperar a que se complete el ciclo para que vuelva a tocar el mismo CDR.`;

    const urlSegura = new URL(this.webhookUrl);
    urlSegura.searchParams.set("wait", "true");

    const webhookResponse = await fetch(urlSegura.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: mensaje }),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Error en el webhook: ${webhookResponse.status}`);
    }
    const data = await webhookResponse.json();

    const emoji = encodeURIComponent("✅");
    const reactUrl = `https://discord.com/api/v10/channels/${data.channel_id}/messages/${data.id}/reactions/${emoji}/@me`;

    const reactResponse = await fetch(reactUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bot ${this.botToken}`,
        "Content-Length": "0",
      },
    });

    // Leer la respuesta cierra la conexión y libera a Pipedream instantáneamente
    await reactResponse.text(); 

    if (!reactResponse.ok) {
      throw new Error(`Error en la reacción: ${reactResponse.status}`);
    }

    $.export("$summary", `Éxito: Se notificó CDR de ${tareaSemana.cdr} y se agregó la reacción.`);

    return {
      messageId: data.id,
      channelId: data.channel_id,
      cdr: tareaSemana.cdr,
      instructor: tareaSemana.instructor,
      timestamp: unixTimestamp,
    };
  },
});