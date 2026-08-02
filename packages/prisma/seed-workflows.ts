import { prisma } from "./src/index.js"

async function seed() {
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log("No user found!")
    return
  }

  await prisma.workflow.createMany({
    data: [
      {
        name: "Sync Leads to CRM",
        description: "Whenever a new lead is added in Google Sheets, sync it to the CRM and notify on Slack.",
        userId: user.id,
        isActive: true,
      },
      {
        name: "Weekly Analytics Report",
        description: "Pull data from GitHub and send a weekly summary email via Gmail.",
        userId: user.id,
        isActive: false,
      },
      {
        name: "Customer Onboarding",
        description: "Send a welcome email, create a Notion page, and message them on Slack.",
        userId: user.id,
        isActive: true,
      },
      {
        name: "Auto-reply to Support Tickets",
        description: "Use Gemini to generate responses to new support emails.",
        userId: user.id,
        isActive: false,
      }
    ]
  })
  
  console.log("Seeded 4 workflows for user: " + user.id)
}

seed().catch(console.error).finally(() => prisma.$disconnect())
