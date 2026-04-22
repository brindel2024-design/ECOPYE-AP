const logger = require('../utils/logger');

// Adaptateur SMS — supporte Twilio (international) et InfoBip (Algérie)
const sendSMS = async (phone, message) => {
  const provider = process.env.SMS_PROVIDER || 'console';

  if (provider === 'twilio') {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: phone
    });
    logger.info(`SMS Twilio envoyé à ${phone}`);
    return;
  }

  if (provider === 'infobip') {
    const response = await fetch(`https://${process.env.INFOBIP_BASE_URL}/sms/2/text/advanced`, {
      method: 'POST',
      headers: {
        Authorization: `App ${process.env.INFOBIP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          from: 'EcoPye',
          destinations: [{ to: phone }],
          text: message
        }]
      })
    });
    if (!response.ok) throw new Error('Échec envoi SMS Infobip');
    logger.info(`SMS Infobip envoyé à ${phone}`);
    return;
  }

  // Console pour développement
  logger.info(`[SMS DEV] → ${phone}: ${message}`);
};

const sendOTP = async (phone, code, purpose) => {
  const messages = {
    register: `EcoPye Pay: Votre code de vérification est ${code}. Valable 10 minutes.`,
    login: `EcoPye Pay: Code de connexion: ${code}. Ne le partagez jamais.`,
    transfer: `EcoPye Pay: Code de confirmation de transfert: ${code}.`,
    reset: `EcoPye Pay: Code de réinitialisation: ${code}. Valable 10 minutes.`
  };
  await sendSMS(phone, messages[purpose] || `EcoPye: ${code}`);
};

module.exports = { sendSMS, sendOTP };
