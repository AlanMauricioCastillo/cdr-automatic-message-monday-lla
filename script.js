const webhookUrl = process.env.WEBHOOK_URL;

if (!webhookUrl) {
  console.error("❌ Faltan variables de entorno (WEBHOOK_URL o ROLE_ID).");
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
const mensaje = `<@&725410477777354782> hoy CDR de ${tareaSemana.cdr} de la mano del ${tareaSemana.instructor}\n\nHoy <t:${unixTimestamp}:t> (tu hora local) - Reaccionen al mensaje para confirmar asistencia`;

// 7. Webhook Dispatch
fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: mensaje })
})
.then(async response => {
  if (response.ok) {
    console.log(`✅ Mensaje enviado: CDR de ${tareaSemana.cdr}`);
  } else {
    console.error(`❌ Error al enviar. Código: ${response.status}`);
    process.exit(1);
  }
})
.catch(error => {
  console.error("❌ Error de red o ejecución:", error);
  process.exit(1);
});
