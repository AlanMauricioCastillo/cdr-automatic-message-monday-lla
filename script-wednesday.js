export default defineComponent({
  name: "Send Discord Entrenamiento Notification",
  description: "Envía un aviso de entrenamiento semanal con horario dinámico y agrega una reacción de asistencia",
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
    // ID del tag general (Reemplázalo si el tag de entrenamiento es diferente)
    const roleId = "1169083732758626426";

    // Cálculo dinámico del Timestamp (22:30 Hora Argentina) para el día actual (miércoles)
    const ahora = new Date();
    const anio = ahora.getUTCFullYear();
    const mes = String(ahora.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getUTCDate()).padStart(2, "0");
    const unixTimestamp = Math.floor(new Date(`${anio}-${mes}-${dia}T22:30:00-03:00`).getTime() / 1000);

    // Mensaje final con mención y la hora local de Discord
    const mensaje = `<@&${roleId}> ¡ATENCIÓN! entrenamiento de pelotón, reaccionar para marcar asistencia.\n\nHoy <t:${unixTimestamp}:t> (tu hora local)`;

    const urlSegura = new URL(this.webhookUrl);
    urlSegura.searchParams.set("wait", "true");

    // 1. Envío del mensaje por Webhook
    const webhookResponse = await fetch(urlSegura.toString(), {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Connection": "close" // Obligatorio para evitar el Timeout
      },
      body: JSON.stringify({ content: mensaje }),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Error en el webhook: ${webhookResponse.status}`);
    }
    
    const data = await webhookResponse.json();

    // 2. Reacción automática del Bot
    const emoji = encodeURIComponent("✅");
    const reactUrl = `https://discord.com/api/v10/channels/${data.channel_id}/messages/${data.id}/reactions/${emoji}/@me`;

    const reactResponse = await fetch(reactUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bot ${this.botToken}`,
        "Content-Length": "0",
        "Connection": "close" // Obligatorio para evitar el Timeout
      },
    });

    // Consumir la respuesta para cerrar la red y liberar el servidor
    await reactResponse.text(); 

    if (!reactResponse.ok) {
      throw new Error(`Error en la reacción: ${reactResponse.status}`);
    }

    $.export("$summary", "Éxito: Se notificó el entrenamiento de pelotón con horario y se agregó la reacción.");

    return {
      messageId: data.id,
      channelId: data.channel_id,
      timestamp: unixTimestamp,
      success: true
    };
  },
});