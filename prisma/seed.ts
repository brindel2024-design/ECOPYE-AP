import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Initialisation de la base de données ECOPYE...')

  // ── Utilisateurs ──────────────────────────────────────────────────────────
  const usersData = [
    { phone: '+213555000001', fullName: 'Youcef Benali',   email: 'youcef@ecopye.dz',  balance: 125000 },
    { phone: '+213555000002', fullName: 'Amina Khelifi',   email: 'amina@ecopye.dz',   balance: 87500  },
    { phone: '+213555000003', fullName: 'Karim Messaoud',  email: 'karim@ecopye.dz',   balance: 210000 },
    { phone: '+213555000004', fullName: 'Sara Boudjelida', email: 'sara@ecopye.dz',    balance: 54000  },
    { phone: '+213555000005', fullName: 'Riad Taleb',      email: 'riad@ecopye.dz',    balance: 320000 },
  ]

  const passwordHash = await bcrypt.hash('password123', 12)

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { phone: u.phone },
      update: {},
      create: {
        phone: u.phone,
        fullName: u.fullName,
        email: u.email,
        passwordHash,
        isVerified: true,
        wallet: { create: { balance: u.balance, currency: 'DZD' } },
      },
    })
    console.log(`✅ ${u.fullName}`)
  }

  const [youcef, amina, karim, sara, riad] = await Promise.all(
    usersData.map((u) => prisma.user.findUnique({ where: { phone: u.phone } }))
  )

  if (!youcef || !amina || !karim || !sara || !riad) throw new Error('Users not found')

  // ── Transferts ────────────────────────────────────────────────────────────
  const transfers = [
    { senderId: youcef.id, receiverId: amina.id,  amount: 5000,  fee: 50,  description: 'Remboursement dîner', daysAgo: 1 },
    { senderId: youcef.id, receiverId: karim.id,  amount: 15000, fee: 150, description: 'Loyer part',          daysAgo: 3 },
    { senderId: amina.id,  receiverId: youcef.id, amount: 3000,  fee: 30,  description: 'Transport commun',    daysAgo: 5 },
    { senderId: karim.id,  receiverId: sara.id,   amount: 8000,  fee: 80,  description: 'Cadeau anniversaire', daysAgo: 7 },
    { senderId: riad.id,   receiverId: youcef.id, amount: 25000, fee: 250, description: 'Freelance paiement',  daysAgo: 10 },
    { senderId: youcef.id, receiverId: riad.id,   amount: 2500,  fee: 25,  description: 'Part bowling',        daysAgo: 12 },
    { senderId: sara.id,   receiverId: amina.id,  amount: 4500,  fee: 45,  description: 'Covoiturage',         daysAgo: 15 },
    { senderId: amina.id,  receiverId: karim.id,  amount: 12000, fee: 120, description: 'Abonnement partagé',  daysAgo: 18 },
    { senderId: karim.id,  receiverId: youcef.id, amount: 6000,  fee: 60,  description: 'Restaurant',          daysAgo: 20 },
    { senderId: riad.id,   receiverId: sara.id,   amount: 50000, fee: 500, description: 'Vente voiture',       daysAgo: 25 },
  ]

  for (const tx of transfers) {
    const createdAt = new Date(Date.now() - tx.daysAgo * 86400000)
    await prisma.transfer.create({
      data: {
        senderId: tx.senderId,
        receiverId: tx.receiverId,
        amount: tx.amount,
        fee: tx.fee,
        description: tx.description,
        status: 'COMPLETED',
        createdAt,
      },
    })
  }
  console.log('✅ Transferts créés')

  // ── Paiements marchands ───────────────────────────────────────────────────
  await prisma.payment.createMany({
    data: [
      { userId: youcef.id, merchantName: 'Carrefour Alger',    amount: 12500, status: 'COMPLETED', paymentMethod: 'WALLET', description: 'Courses alimentaires' },
      { userId: youcef.id, merchantName: 'Djezzy Store',       amount: 2000,  status: 'COMPLETED', paymentMethod: 'WALLET', description: 'Recharge forfait' },
      { userId: youcef.id, merchantName: 'Pizza Casa',         amount: 4200,  status: 'COMPLETED', paymentMethod: 'WALLET', description: 'Livraison pizza' },
      { userId: amina.id,  merchantName: 'BioSanté Pharmacie', amount: 3600,  status: 'COMPLETED', paymentMethod: 'WALLET', description: 'Médicaments' },
      { userId: amina.id,  merchantName: 'Zara Bab Ezzouar',   amount: 18000, status: 'COMPLETED', paymentMethod: 'WALLET', description: 'Vêtements' },
      { userId: karim.id,  merchantName: 'Total Energies',     amount: 8500,  status: 'COMPLETED', paymentMethod: 'WALLET', description: 'Carburant' },
    ],
  })
  console.log('✅ Paiements marchands créés')

  // ── Factures ──────────────────────────────────────────────────────────────
  const bills = [
    { userId: youcef.id, provider: 'sonelgaz', accountNumber: '1234567890', amount: 4800,  daysAgo: 2  },
    { userId: youcef.id, provider: 'mobilis',  accountNumber: '0555000001', amount: 1500,  daysAgo: 8  },
    { userId: youcef.id, provider: 'djezzy',   accountNumber: '0770000001', amount: 1000,  daysAgo: 15 },
    { userId: amina.id,  provider: 'seaal',     accountNumber: '9876543210', amount: 2200,  daysAgo: 3  },
    { userId: amina.id,  provider: 'algerie_telecom', accountNumber: '021456789', amount: 3500, daysAgo: 10 },
    { userId: karim.id,  provider: 'sonelgaz', accountNumber: '5544332211', amount: 7200,  daysAgo: 5  },
    { userId: riad.id,   provider: 'ooredoo',  accountNumber: '0770500001', amount: 2000,  daysAgo: 1  },
  ]

  for (const bill of bills) {
    const paidAt = new Date(Date.now() - bill.daysAgo * 86400000)
    await prisma.billPayment.create({
      data: {
        userId: bill.userId,
        provider: bill.provider,
        accountNumber: bill.accountNumber,
        amount: bill.amount,
        status: 'COMPLETED',
        paidAt,
      },
    })
  }
  console.log('✅ Factures créées')

  // ── Cagnottes ─────────────────────────────────────────────────────────────
  const cagnottes = [
    {
      creatorId: youcef.id,
      title: 'Voyage à Tlemcen',
      description: 'Organisons un road trip épique à Tlemcen ce été !',
      targetAmount: 150000,
      currentAmount: 67500,
      isPublic: true,
      daysAgo: 5,
      contributions: [
        { userId: amina.id,  amount: 15000, message: 'Super idée ! Je suis partant 🎉' },
        { userId: karim.id,  amount: 20000, message: 'Je participe avec plaisir !' },
        { userId: sara.id,   amount: 12500, message: 'Comptez sur moi !' },
        { userId: riad.id,   amount: 20000, message: 'Vivement les vacances !' },
      ],
    },
    {
      creatorId: amina.id,
      title: 'Cadeau départ Mme Bensalem',
      description: 'Participez pour offrir un beau cadeau à notre collègue qui part à la retraite.',
      targetAmount: 30000,
      currentAmount: 21000,
      isPublic: false,
      daysAgo: 3,
      contributions: [
        { userId: youcef.id, amount: 5000,  message: '' },
        { userId: karim.id,  amount: 8000,  message: 'Belle initiative !' },
        { userId: riad.id,   amount: 8000,  message: '' },
      ],
    },
    {
      creatorId: karim.id,
      title: 'Équipement terrain foot',
      description: 'Nouveaux équipements pour notre équipe du quartier !',
      targetAmount: 80000,
      currentAmount: 34000,
      isPublic: true,
      daysAgo: 10,
      contributions: [
        { userId: youcef.id, amount: 10000, message: 'Allez les gars !' },
        { userId: sara.id,   amount: 9000,  message: 'Good luck ! 💪' },
        { userId: riad.id,   amount: 15000, message: 'Pour le sport algérien !' },
      ],
    },
  ]

  for (const c of cagnottes) {
    const createdAt = new Date(Date.now() - c.daysAgo * 86400000)
    const cagnotte = await prisma.cagnotte.create({
      data: {
        creatorId: c.creatorId,
        title: c.title,
        description: c.description,
        targetAmount: c.targetAmount,
        currentAmount: c.currentAmount,
        isPublic: c.isPublic,
        shareCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
        createdAt,
      },
    })

    for (const contrib of c.contributions) {
      await prisma.cagnotteContribution.create({
        data: {
          cagnotteId: cagnotte.id,
          userId: contrib.userId,
          amount: contrib.amount,
          message: contrib.message || null,
          createdAt: new Date(createdAt.getTime() + Math.random() * 3 * 86400000),
        },
      })
    }
  }
  console.log('✅ Cagnottes créées')

  // ── Notifications ─────────────────────────────────────────────────────────
  const notifications = [
    {
      userId: youcef.id,
      title: 'Argent reçu 🎉',
      body: '25 000 DZD reçus de Riad Taleb',
      type: 'transfer_received',
      isRead: false,
      daysAgo: 0.5,
    },
    {
      userId: youcef.id,
      title: 'Transfert envoyé',
      body: '15 000 DZD envoyés à Karim Messaoud',
      type: 'transfer_sent',
      isRead: true,
      daysAgo: 3,
    },
    {
      userId: youcef.id,
      title: 'Facture Sonelgaz payée',
      body: '4 800 DZD débités — N° 1234567890',
      type: 'bill_paid',
      isRead: false,
      daysAgo: 2,
    },
    {
      userId: youcef.id,
      title: 'Nouvelle contribution',
      body: 'Amina Khelifi a contribué 15 000 DZD à votre cagnotte "Voyage à Tlemcen"',
      type: 'cagnotte',
      isRead: false,
      daysAgo: 1,
    },
    {
      userId: youcef.id,
      title: 'Bienvenue sur ECOPYE !',
      body: "Votre compte est vérifié. Commencez à envoyer et recevoir de l'argent.",
      type: 'system',
      isRead: true,
      daysAgo: 30,
    },
  ]

  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        userId: n.userId,
        title: n.title,
        body: n.body,
        type: n.type,
        isRead: n.isRead,
        createdAt: new Date(Date.now() - n.daysAgo * 86400000),
      },
    })
  }
  console.log('✅ Notifications créées')

  // ── Audit logs ────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: youcef.id, action: 'login',        resource: 'User',        resourceId: youcef.id, status: 'SUCCESS', metadata: JSON.stringify({ ip: '192.168.1.1' }) },
      { userId: youcef.id, action: 'transfer',     resource: 'Transfer',    status: 'SUCCESS', metadata: JSON.stringify({ amount: 15000 }) },
      { userId: youcef.id, action: 'bill_payment', resource: 'BillPayment', status: 'SUCCESS', metadata: JSON.stringify({ provider: 'sonelgaz', amount: 4800 }) },
      { userId: amina.id,  action: 'login',        resource: 'User',        resourceId: amina.id, status: 'SUCCESS', metadata: JSON.stringify({ ip: '10.0.0.5' }) },
      { userId: karim.id,  action: 'transfer',     resource: 'Transfer',    status: 'SUCCESS', metadata: JSON.stringify({ amount: 8000 }) },
    ],
  })
  console.log('✅ Audit logs créés')

  console.log('\n🎉 Base de données initialisée avec succès!')
  console.log('📱 Compte principal : +213555000001 / password123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
