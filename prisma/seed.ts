import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Check for existing segments or wheel? 
  // For dev, if we clear segments, we should also clear wheels to avoid duplicates or orphaned wheels.
  // await prisma.wheel.deleteMany({}) // Careful with cascades in real app, ok for dev if empty.

  // Create Main Wheel
  const mainWheel = await prisma.wheel.upsert({
    where: { slug: 'main-wheel' },
    update: {},
    create: {
      name: 'Main Wheel',
      slug: 'main-wheel',
      isEnabled: true
    }
  })

  // console.log('Created Main Wheel:', mainWheel)

  const segments = [
    { label: 'Grand Prize (iPhone)', color: '#ef4444', stock: 1, probability: 0.01, wheelId: mainWheel.id }, // Red
    { label: 'Try Again', color: '#6b7280', stock: 9999, probability: 0.50, wheelId: mainWheel.id }, // Gray
    { label: 'Small Prize ($5)', color: '#f97316', stock: 50, probability: 0.20, wheelId: mainWheel.id }, // Orange
    { label: 'Medium Prize ($20)', color: '#eab308', stock: 10, probability: 0.10, wheelId: mainWheel.id }, // Yellow
    { label: 'Discount 10%', color: '#84cc16', stock: 100, probability: 0.10, wheelId: mainWheel.id }, // Lime
    { label: 'Discount 50%', color: '#06b6d4', stock: 5, probability: 0.05, wheelId: mainWheel.id }, // Cyan
    { label: 'Mystery Box', color: '#8b5cf6', stock: 20, probability: 0.03, wheelId: mainWheel.id }, // Violet
    { label: 'Bonus Spin', color: '#ec4899', stock: 30, probability: 0.01, wheelId: mainWheel.id }, // Pink
  ]

  console.log('Seeding segments...')
  for (const seg of segments) {
    // Upsert or create. For simplicity in seed, let's create if not exists or similar logic. 
    // But user had simple create loop. Let's just create.
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
