// Service SMS — adaptatif : console (dev), Infobip (Algérie prod), Twilio (international)

export async function sendSMS(phone: string, message: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER || 'console'

  if (provider === 'infobip') {
    const res = await fetch(`https://${process.env.INFOBIP_BASE_URL}/sms/2/text/advanced`, {
      method: 'POST',
      headers: {
        Authorization: `App ${process.env.INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        messages: [{ from: 'EcoPye', destinations: [{ to: phone }], text: message }],
      }),
    })
    if (!res.ok) throw new Error('Infobip SMS failed')
    return
  }

  if (provider === 'twilio') {
    // eval() prevents webpack from bundling optional twilio dep at build time
    const twilio = (0, eval)('require')('twilio') as any
    const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_AUTH_TOKEN!)
    await client.messages.create({ body: message, from: process.env.TWILIO_PHONE!, to: phone })
    return
  }

  // console (développement)
  console.log(`\n📱 [SMS DEV] → ${phone}\n   ${message}\n`)
}

export async function sendOTP(phone: string, code: string, purpose: string): Promise<void> {
  const messages: Record<string, string> = {
    register: `EcoPye: Votre code de vérification est ${code}. Valable 10 min. Ne le partagez jamais.`,
    login:    `EcoPye: Code de connexion: ${code}. Valable 5 min.`,
    transfer: `EcoPye: Confirmez votre transfert avec le code: ${code}.`,
    reset:    `EcoPye: Réinitialisation de mot de passe: ${code}. Valable 10 min.`,
  }
  await sendSMS(phone, messages[purpose] ?? `EcoPye: ${code}`)
}
