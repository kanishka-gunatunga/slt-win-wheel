import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clear existing if any (optional, but good for dev)
  // await prisma.segment.deleteMany({})

  const segments = [
    { label: 'Grand Prize (iPhone)', color: '#ef4444', stock: 1, probability: 0.01 }, // Red
    { label: 'Try Again', color: '#6b7280', stock: 9999, probability: 0.50 }, // Gray
    { label: 'Small Prize ($5)', color: '#f97316', stock: 50, probability: 0.20 }, // Orange
    { label: 'Medium Prize ($20)', color: '#eab308', stock: 10, probability: 0.10 }, // Yellow
    { label: 'Discount 10%', color: '#84cc16', stock: 100, probability: 0.10 }, // Lime
    { label: 'Discount 50%', color: '#06b6d4', stock: 5, probability: 0.05 }, // Cyan
    { label: 'Mystery Box', color: '#8b5cf6', stock: 20, probability: 0.03 }, // Violet
    { label: 'Bonus Spin', color: '#ec4899', stock: 30, probability: 0.01 }, // Pink
  ]

  console.log('Seeding segments...')
  for (const seg of segments) {
    await prisma.segment.create({ data: seg })
  }

  const hashedPassword = await hash('admin123', 10)

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword
    }
  })

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
