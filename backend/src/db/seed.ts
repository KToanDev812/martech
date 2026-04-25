/**
 * Seed script for development/testing
 * Run with: npm run seed
 */

import { Pool } from 'pg'
import { hash } from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

interface User {
  id: string
  email: string
  password: string
  name: string
}

interface Recipient {
  id: string
  email: string
  name: string
}

interface Campaign {
  id: string
  name: string
  subject: string
  body: string
  status: string
  created_by: string
  scheduled_at?: Date | null
}

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    await pool.query('BEGIN')

    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await pool.query('DELETE FROM campaign_recipients')
    await pool.query('DELETE FROM campaigns')
    await pool.query('DELETE FROM recipients')
    await pool.query('DELETE FROM users')

    // Create test users
    console.log('👤 Creating test users...')
    const hashedPassword = await hash('password123', 10)

    const users: User[] = [
      {
        id: uuidv4(),
        email: 'admin@martech.com',
        password: hashedPassword,
        name: 'Admin User',
      },
    ]

    for (const user of users) {
      await pool.query(
        'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
        [user.id, user.email, user.password, user.name]
      )
      console.log(`  ✓ Created user: ${user.email}`)
    }

    // Create recipients
    console.log('📧 Creating recipients...')
    const recipients: Recipient[] = [
      { id: uuidv4(), email: 'subscriber1@example.com', name: 'Subscriber One' },
      { id: uuidv4(), email: 'subscriber2@example.com', name: 'Subscriber Two' },
      { id: uuidv4(), email: 'subscriber3@example.com', name: 'Subscriber Three' },
      { id: uuidv4(), email: 'subscriber4@example.com', name: 'Subscriber Four' },
      { id: uuidv4(), email: 'subscriber5@example.com', name: 'Subscriber Five' },
      { id: uuidv4(), email: 'vip@example.com', name: 'VIP Customer' },
      { id: uuidv4(), email: 'lead@example.com', name: 'Lead Customer' },
      { id: uuidv4(), email: 'prospect@example.com', name: 'Prospect Customer' },
    ]

    for (const recipient of recipients) {
      await pool.query(
        'INSERT INTO recipients (id, email, name) VALUES ($1, $2, $3)',
        [recipient.id, recipient.email, recipient.name]
      )
      console.log(`  ✓ Created recipient: ${recipient.email}`)
    }

    // Create campaigns with different statuses
    console.log('📨 Creating campaigns...')

    // Campaign templates
    const campaignTemplates = [
      { name: 'Welcome Email Series', subject: 'Welcome to our service!', body: 'Hi {{name}}, welcome to our platform. We are excited to have you on board.' },
      { name: 'Monthly Newsletter - April', subject: 'Your Monthly Update is Here', body: 'Here is what happened this month at our company. We have great news to share!' },
      { name: 'Monthly Newsletter - March', subject: 'March Updates and News', body: 'Check out the latest updates from our team this month.' },
      { name: 'Product Launch Announcement', subject: 'Introducing Our New Product!', body: 'We are thrilled to announce the launch of our new product.' },
      { name: 'Special Offer - 50% Off', subject: 'Limited Time: 50% Off Everything', body: 'Do not miss out on our biggest sale of the year!' },
      { name: 'Weekly Tips - Week 1', subject: '5 Tips for Better Results', body: 'Here are our top 5 tips to improve your workflow.' },
      { name: 'Weekly Tips - Week 2', subject: 'Advanced Techniques Revealed', body: 'Take your skills to the next level with these advanced techniques.' },
      { name: 'Weekly Tips - Week 3', subject: 'Best Practices Guide', body: 'Learn the best practices that industry experts recommend.' },
      { name: 'Weekly Tips - Week 4', subject: 'Common Mistakes to Avoid', body: 'Discover the most common mistakes and how to avoid them.' },
      { name: 'Customer Feedback Survey', subject: 'We Want to Hear From You', body: 'Help us improve by sharing your feedback in our short survey.' },
      { name: 'Webinar Invitation', subject: 'Join Our Exclusive Webinar', body: 'You are invited to our exclusive webinar on industry trends.' },
      { name: 'Product Update - New Features', subject: 'Exciting New Features Available', body: 'Check out the new features we have just released.' },
      { name: 'Holiday Special', subject: 'Holiday Savings Inside', body: 'Celebrate with our special holiday offers and discounts.' },
      { name: 'Year in Review', subject: 'Our Year in Review', body: 'Take a look back at what we accomplished together this year.' },
      { name: 'Upcoming Events', subject: 'Events You Should Not Miss', body: 'Mark your calendars for these upcoming events and workshops.' },
      { name: 'Case Study: Success Story', subject: 'How Our Customer Achieved Success', body: 'Read this inspiring success story from one of our customers.' },
      { name: 'Industry Insights', subject: 'Latest Industry Trends', body: 'Stay ahead with these insights into current industry trends.' },
      { name: 'Tutorial: Getting Started', subject: 'Quick Start Guide', body: 'Get started quickly with our easy-to-follow tutorial.' },
      { name: 'Maintenance Notice', subject: 'Scheduled Maintenance', body: 'We will be performing scheduled maintenance on our platform.' },
      { name: 'Thank You Message', subject: 'Thank You for Being With Us', body: 'We appreciate your continued support and trust in our services.' },
    ]

    const campaigns: Campaign[] = []
    const statuses: Array<'draft' | 'scheduled' | 'sent'> = ['draft', 'draft', 'draft', 'draft', 'draft', 'draft', 'draft', 'scheduled', 'scheduled', 'sent', 'sent', 'sent', 'sent', 'sent', 'sent', 'sent', 'sent', 'sent', 'sent', 'sent']

    for (let i = 0; i < campaignTemplates.length; i++) {
      const template = campaignTemplates[i]
      const status = statuses[i]

      const campaign: Campaign = {
        id: uuidv4(),
        name: template.name,
        subject: template.subject,
        body: template.body,
        status: status,
        created_by: users[0].id,
      }

      if (status === 'scheduled') {
        // Schedule at different times in the future
        const daysFromNow = (i % 5) + 1
        campaign.scheduled_at = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000)
      }

      campaigns.push(campaign)
    }

    for (const campaign of campaigns) {
      await pool.query(
        `INSERT INTO campaigns (id, name, subject, body, status, created_by, scheduled_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          campaign.id,
          campaign.name,
          campaign.subject,
          campaign.body,
          campaign.status,
          campaign.created_by,
          campaign.scheduled_at || null,
        ]
      )
      console.log(`  ✓ Created campaign: ${campaign.name} (${campaign.status})`)

      // Add recipients to campaigns
      const numRecipients = Math.floor(Math.random() * 6) + 3 // 3-8 recipients
      const shuffledRecipients = recipients.sort(() => Math.random() - 0.5)

      for (let i = 0; i < numRecipients && i < shuffledRecipients.length; i++) {
        const status = campaign.status === 'sent' ? 'sent' : 'pending'
        await pool.query(
          `INSERT INTO campaign_recipients (campaign_id, recipient_id, status)
           VALUES ($1, $2, $3)`,
          [campaign.id, shuffledRecipients[i].id, status]
        )
      }
    }

    await pool.query('COMMIT')
    console.log('\n✅ Database seeded successfully!')
    console.log('\n📝 Test Account:')
    console.log('   Email: admin@martech.com / Password: password123')
    console.log('\n📊 Seed Data Summary:')
    console.log(`   Users: ${users.length}`)
    console.log(`   Recipients: ${recipients.length}`)
    console.log(`   Campaigns: ${campaigns.length}`)
    console.log(`   Draft: ${campaigns.filter(c => c.status === 'draft').length}`)
    console.log(`   Scheduled: ${campaigns.filter(c => c.status === 'scheduled').length}`)
    console.log(`   Sent: ${campaigns.filter(c => c.status === 'sent').length}`)
  } catch (error) {
    await pool.query('ROLLBACK')
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await pool.end()
  }
}

seed().catch(console.error)
