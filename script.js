const webhookUrl = process.env.WEBHOOK_URL;
const botToken = process.env.BOT_TOKEN;

if (!webhookUrl) {
  console.error("❌ The environment variable is missing WEBHOOK_URL.");
  process.exit(1);
}

// 1. Dictionary of Instructor IDs (Replace with the actual ones)
const instructores = {
  strood: "<@726943204607262790>",
  omega: "<@493493858781364228>",
  eduardo: "<@258770781331390464>",
  alan: "<@417006877487005697>",
  thiago: "<@1246095207523684447>" // Thiago's ID provided
};

// 2. Base date: Monday, August 3, 2026 (Month 7 in JS)
const fechaBase = new Date(Date.UTC(2026, 7, 3));
const ahora = new Date();

// 3. Calculation of the index for the 8-week macrocycle
const diferenciaMs = ahora.getTime() - fechaBase.getTime();
const semanasTranscurridas = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24 * 7));
const indice = semanasTranscurridas % 8;

// 4. Structured Timeline with Tags
const cronograma = [
  { cdr: "CQB", instructor: instructores.strood },
  { cdr: "Saltos y Movimientos", instructor: instructores.omega },
  { cdr: "Paracaidismo y Rappel", instructor: instructores.alan },
  { cdr: "Orientación", instructor: instructores.thiago },
  { cdr: "CQB", instructor: instructores.strood },
  { cdr: "Saltos y Movimientos", instructor: instructores.omega },
  { cdr: "Paracaidismo y Rappel", instructor: instructores.eduardo },
  { cdr: "Orientación", instructor: instructores.thiago }
];

const tareaSemana = cronograma[indice];

// 5. Dynamic Calculation of the Discord Timestamp for 10:30 p.m. (Argentina Time)
// We take the year, month, and day of the execution date (today, Monday)
const anio = ahora.getUTCFullYear();
const mes = String(ahora.getUTCMonth() + 1).padStart(2, '0');
const dia = String(ahora.getUTCDate()).padStart(2, '0');

// We set the time zone to Argentina (-03:00) at 10:30 p.m.
const fechaEventoString = `${anio}-${mes}-${dia}T22:30:00-03:00`;
const fechaEvento = new Date(fechaEventoString);
// Discord requires the timestamp in seconds (Unix), so we divide by 1,000
const unixTimestamp = Math.floor(fechaEvento.getTime() / 1000);

// 6. Preparing the final message with formatting
/* const mensaje = `<@&725410477777354782> hoy CDR de ${tareaSemana.cdr} de la mano del ${tareaSemana.instructor}\n\nHoy <t:${unixTimestamp}:t> (tu hora local) - Reaccionen al mensaje para confirmar asistencia`; */
const mensaje = `test lorem ipsum dolor sit amet, \n\n consectetur adipiscing elit.`;

// 7. Set up a secure URL to force Discord to return the message data
const urlSegura = new URL(webhookUrl);
urlSegura.searchParams.set('wait', 'true');

// 8. Webhook Dispatch
fetch(urlSegura.toString(), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: mensaje })
})
  .then(async response => {
    if (response.ok) {
      // Error prevention: If it returns 204 anyway, we stop before the JSON
      if (response.status === 204) {
         console.error("❌ Discord devolvió 204 (Vacío). El parámetro wait=true fue ignorado.");
         process.exit(1);
      }

      const data = await response.json();
      console.log(`✅ Message sent: CDR of ${tareaSemana.cdr}`);

      // 8-1. If the Bot Token is configured, add the automatic reaction
      if (botToken) {

        console.log("datadatadata", data)
        console.info("datadatadata", data)

        const channelId = data.channel_id;
        const messageId = data.id;

        // We use the green checkmark by default. `encodeURIComponent` is required to send emojis in URLs.
        const emoji = encodeURIComponent("✅");

        const reactUrl = `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${emoji}/@me`;

        const reactResponse = await fetch(reactUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Length': '0'
          }
        });

        if (reactResponse.ok) {
          console.log("✅ Automatic attendance response successfully added.");
        } else {
          const errorReact = await reactResponse.text();
          console.error(`❌ Error attempting to react. Code: ${reactResponse.status}. Detail: ${errorReact}`);
        }
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Error sending message. Code: ${response.status}. Detail: ${errorText}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error("❌ Network or execution error:", error);
    process.exit(1);
  });