import { axios } from "@pipedream/platform";

export default defineComponent({
  name: "Send Discord CDR Notification",
  description: "Sends a weekly CDR notification to Discord with rotating instructors and adds a reaction",
  type: "action",
  props: {
    webhookUrl: {
      type: "string",
      label: "Discord Webhook URL",
      description: "The Discord webhook URL to send the message to",
    },
    botToken: {
      type: "string",
      label: "Discord Bot Token",
      description: "The Discord bot token for adding reactions",
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

    const fechaBase = new Date(Date.UTC(2026, 7, 3));
    const ahora = new Date();
    const semanasTranscurridas = Math.floor((ahora.getTime() - fechaBase.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const indice = semanasTranscurridas % 4;

    const cronograma = [
      { cdr: "INMT", instructor: instructores.alan },
      { cdr: "CQB", instructor: instructores.strood },
      { cdr: "INMT", instructor: instructores.eduardo },
      { cdr: "CQB", instructor: instructores.vermis },
    ];

    const tareaSemana = cronograma[indice];

    const anio = ahora.getUTCFullYear();
    const mes = String(ahora.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getUTCDate()).padStart(2, "0");
    const unixTimestamp = Math.floor(new Date(`${anio}-${mes}-${dia}T22:30:00-03:00`).getTime() / 1000);

    // Original message format with instructor mention
    const mensaje = `<@&725410477777354782> hoy CDR de ${tareaSemana.cdr} de la mano del ${tareaSemana.instructor}\n\nHoy <t:${unixTimestamp}:t> (tu hora local) - Reaccionen al mensaje para confirmar asistencia \n\n**NOTA:** Si no llegamos a 4 reacciones de reclutas, el CDR se cancela y se deberá esperar a que se complete el ciclo para que vuelva a tocar el mismo CDR.`;

    const urlSegura = new URL(this.webhookUrl);
    urlSegura.searchParams.set("wait", "true");

    const webhookResponse = await axios($, {
      url: urlSegura.toString(),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        content: mensaje,
      },
    });

    if (!webhookResponse.id) {
      throw new Error("No se pudo obtener el ID del mensaje");
    }

    const emoji = encodeURIComponent("✅");
    const reactUrl = `https://discord.com/api/v10/channels/${webhookResponse.channel_id}/messages/${webhookResponse.id}/reactions/${emoji}/@me`;

    await axios($, {
      url: reactUrl,
      method: "PUT",
      headers: {
        Authorization: `Bot ${this.botToken}`,
        "Content-Length": "0",
      },
    });

    $.export("$summary", `Successfully sent CDR notification for ${tareaSemana.cdr} with ${tareaSemana.instructor} and added reaction`);

    return {
      messageId: webhookResponse.id,
      channelId: webhookResponse.channel_id,
      cdr: tareaSemana.cdr,
      instructor: tareaSemana.instructor,
      timestamp: unixTimestamp,
    };
  },
});