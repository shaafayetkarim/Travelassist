import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@travelbuddy.com" },
    update: {},
    create: {
      email: "admin@travelbuddy.com",
      name: "Admin User",
      password: adminPassword,
      type: "ADMIN",
      isPremium: true,
    },
  })

  // Create regular user
  const userPassword = await bcrypt.hash("user123", 12)
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "John Doe",
      password: userPassword,
      type: "CUSTOMER",
      isPremium: false,
      interests: "Adventure, Photography, Culture",
      location: "New York, USA",
      bio: "Love exploring new places and meeting fellow travelers!",
    },
  })

  // Create premium user
  const premiumPassword = await bcrypt.hash("premium123", 12)
  const premiumUser = await prisma.user.upsert({
    where: { email: "premium@example.com" },
    update: {},
    create: {
      email: "premium@example.com",
      name: "Jane Smith",
      password: premiumPassword,
      type: "CUSTOMER",
      isPremium: true,
      interests: "Luxury Travel, Food, Culture, Photography",
      location: "San Francisco, USA",
      bio: "Premium traveler sharing exclusive experiences and hidden gems.",
    },
  })

  // Create another premium user
  const premium2Password = await bcrypt.hash("premium2123", 12)
  const premiumUser2 = await prisma.user.upsert({
    where: { email: "premium2@example.com" },
    update: {},
    create: {
      email: "premium2@example.com",
      name: "Alex Johnson",
      password: premium2Password,
      type: "CUSTOMER",
      isPremium: true,
      interests: "Adventure, Hiking, Nature",
      location: "Denver, USA",
      bio: "Adventure seeker and nature photographer.",
    },
  })

  // Create sample blogs
  const blog1 = await prisma.blog.create({
    data: {
      title: "Amazing Journey Through Bali",
      content: `
        <h2>Discovering the Magic of Bali</h2>
        <p>Bali, the Island of the Gods, offers an incredible blend of natural beauty, rich culture, and spiritual experiences. During my recent trip, I discovered hidden gems that most tourists never see.</p>
        
        <h3>Day 1-2: Ubud - The Cultural Heart</h3>
        <p>Started my journey in Ubud, surrounded by lush rice terraces and traditional villages. The Tegallalang Rice Terraces at sunrise were absolutely breathtaking. Don't miss the Sacred Monkey Forest Sanctuary - just watch your belongings!</p>
        
        <h3>Day 3-4: Seminyak - Beach Bliss</h3>
        <p>Moved to Seminyak for some beach time. The sunsets here are legendary, especially from La Plancha beach bar. The beach clubs offer great vibes, but can get crowded during peak season.</p>
        
        <h3>Local Tips:</h3>
        <ul>
          <li>Rent a scooter for easy transportation</li>
          <li>Try the local warungs for authentic Indonesian food</li>
          <li>Visit temples during early morning or late afternoon</li>
          <li>Always carry cash - many places don't accept cards</li>
        </ul>
      `,
      preview:
        "Discover the hidden gems of Bali with stunning temples, beautiful beaches, and incredible local cuisine...",
      location: "Bali, Indonesia",
      tags: ["Adventure", "Culture", "Beach", "Solo Travel"],
      images: ["/luxury-bali-resort.png"],
      authorId: user.id,
      isPremium: false,
    },
  })

  const blog2 = await prisma.blog.create({
    data: {
      title: "Tokyo Street Food Adventure",
      content: `
        <h2>A Culinary Journey Through Tokyo</h2>
        <p>Tokyo's street food scene is unparalleled. From tiny ramen shops to bustling food markets, every corner offers a new culinary adventure.</p>
        
        <h3>Tsukiji Outer Market</h3>
        <p>Start your food journey at the famous Tsukiji Outer Market. The fresh sushi here is incredible, and the tuna auctions (if you can get up early enough) are a sight to behold.</p>
        
        <h3>Must-Try Foods:</h3>
        <ul>
          <li>Ramen from Ichiran or Ippudo</li>
          <li>Fresh sushi at Tsukiji</li>
          <li>Takoyaki from street vendors</li>
          <li>Wagyu beef at a local yakiniku</li>
          <li>Matcha everything in Harajuku</li>
        </ul>
      `,
      preview: "Experience the vibrant street food culture of Tokyo, from ramen shops to sushi bars...",
      location: "Tokyo, Japan",
      tags: ["Food", "Culture", "City", "Solo Travel"],
      images: ["/placeholder-a7zaq.png"],
      authorId: premiumUser.id,
      isPremium: false,
    },
  })

  // Create premium community posts
  const premiumBlog1 = await prisma.blog.create({
    data: {
      title: "Exclusive Luxury Resort Experience in Maldives",
      content: `
        <h2>Premium Paradise: My Stay at Soneva Jani</h2>
        <p>As a premium member, I had the privilege of experiencing one of the most exclusive resorts in the Maldives. Soneva Jani offers unparalleled luxury with overwater villas and world-class service.</p>
        
        <h3>The Villa Experience</h3>
        <p>Our overwater villa featured a retractable roof for stargazing, a private slide into the lagoon, and a dedicated butler service. The attention to detail was extraordinary.</p>
        
        <h3>Exclusive Dining</h3>
        <p>The resort's restaurants offer Michelin-star quality cuisine with ingredients flown in daily. The underwater restaurant was a particular highlight.</p>
        
        <h3>Premium Tips:</h3>
        <ul>
          <li>Book the villa with the slide - it's worth the extra cost</li>
          <li>Don't miss the overwater cinema experience</li>
          <li>The spa treatments using local ingredients are exceptional</li>
          <li>Private yacht excursions can be arranged through concierge</li>
        </ul>
      `,
      preview: "An exclusive look at luxury travel in the Maldives with premium amenities and world-class service...",
      location: "Maldives",
      tags: ["Luxury", "Resort", "Premium", "Overwater Villa"],
      images: ["/luxury-bali-resort.png"],
      authorId: premiumUser.id,
      isPremium: true,
    },
  })

  const premiumBlog2 = await prisma.blog.create({
    data: {
      title: "Private Safari Experience in Kenya",
      content: `
        <h2>Beyond the Ordinary: Private Safari Adventures</h2>
        <p>This premium safari experience in Kenya's Maasai Mara offered exclusive access to private conservancies and personalized wildlife encounters.</p>
        
        <h3>Private Conservancy Access</h3>
        <p>Unlike crowded national parks, our private conservancy allowed for off-road driving and night game drives. We had close encounters with the Big Five without the tourist crowds.</p>
        
        <h3>Luxury Tented Camp</h3>
        <p>Our camp featured spacious canvas tents with en-suite bathrooms, private decks overlooking the savanna, and gourmet meals prepared by a private chef.</p>
        
        <h3>Exclusive Experiences:</h3>
        <ul>
          <li>Hot air balloon safari at sunrise</li>
          <li>Walking safaris with Maasai guides</li>
          <li>Private photography sessions with wildlife</li>
          <li>Cultural visits to authentic Maasai villages</li>
        </ul>
      `,
      preview: "Experience the ultimate safari adventure with private conservancy access and luxury accommodations...",
      location: "Kenya",
      tags: ["Safari", "Luxury", "Wildlife", "Premium"],
      images: ["/placeholder-a7zaq.png"],
      authorId: premiumUser2.id,
      isPremium: true,
    },
  })

  // Create sample trips
  const trip1 = await prisma.trip.create({
    data: {
      destination: "Bali, Indonesia",
      startDate: new Date("2024-12-15"),
      endDate: new Date("2024-12-22"),
      budget: "$800-1200",
      description:
        "An amazing adventure through the beautiful islands of Bali, exploring temples, beaches, and local culture.",
      isPublic: true,
      maxParticipants: 6,
      creatorId: user.id,
    },
  })

  const trip2 = await prisma.trip.create({
    data: {
      destination: "Tokyo, Japan",
      startDate: new Date("2025-01-10"),
      endDate: new Date("2025-01-17"),
      budget: "$1200-1800",
      description: "Explore the vibrant culture, amazing food, and modern technology of Tokyo.",
      isPublic: true,
      maxParticipants: 4,
      creatorId: premiumUser.id,
    },
  })

  // Add trip participants
  await prisma.tripParticipant.create({
    data: {
      userId: user.id,
      tripId: trip1.id,
      role: "CREATOR",
    },
  })

  await prisma.tripParticipant.create({
    data: {
      userId: premiumUser.id,
      tripId: trip1.id,
      role: "PARTICIPANT",
    },
  })

  await prisma.tripParticipant.create({
    data: {
      userId: premiumUser.id,
      tripId: trip2.id,
      role: "CREATOR",
    },
  })

  await prisma.tripParticipant.create({
    data: {
      userId: premiumUser2.id,
      tripId: trip2.id,
      role: "PARTICIPANT",
    },
  })

  // Create sample todo items
  await prisma.todoItem.createMany({
    data: [
      {
        text: "Visit Tanah Lot Temple",
        completed: false,
        tripId: trip1.id,
        createdBy: user.id,
      },
      {
        text: "Explore Ubud Rice Terraces",
        completed: true,
        tripId: trip1.id,
        createdBy: user.id,
      },
      {
        text: "Beach day at Seminyak",
        completed: false,
        tripId: trip1.id,
        createdBy: premiumUser.id,
      },
      {
        text: "Try traditional Balinese cuisine",
        completed: false,
        tripId: trip1.id,
        createdBy: user.id,
      },
      {
        text: "Visit Tsukiji Fish Market",
        completed: false,
        tripId: trip2.id,
        createdBy: premiumUser.id,
      },
      {
        text: "Explore Shibuya Crossing",
        completed: false,
        tripId: trip2.id,
        createdBy: premiumUser.id,
      },
      {
        text: "Try authentic ramen",
        completed: true,
        tripId: trip2.id,
        createdBy: premiumUser2.id,
      },
      {
        text: "Visit Tokyo Skytree",
        completed: false,
        tripId: trip2.id,
        createdBy: premiumUser.id,
      },
    ],
  })

  // Create sample likes
  await prisma.like.createMany({
    data: [
      {
        userId: premiumUser.id,
        blogId: blog1.id,
      },
      {
        userId: user.id,
        blogId: blog2.id,
      },
      {
        userId: premiumUser2.id,
        blogId: premiumBlog1.id,
      },
    ],
  })

  // Create sample wishlists
  await prisma.wishlist.createMany({
    data: [
      {
        userId: user.id,
        blogId: blog2.id,
      },
      {
        userId: premiumUser.id,
        blogId: premiumBlog2.id,
      },
    ],
  })

  // Create sample buddy requests
  await prisma.buddyRequest.createMany({
    data: [
      {
        requesterId: user.id,
        receiverId: premiumUser.id,
        status: "ACCEPTED",
      },
      {
        requesterId: premiumUser.id,
        receiverId: premiumUser2.id,
        status: "ACCEPTED",
      },
      {
        requesterId: user.id,
        receiverId: premiumUser2.id,
        status: "PENDING",
      },
    ],
  })

  console.log("Database seeded successfully!")
  console.log({ admin, user, premiumUser, premiumUser2, blog1, blog2, premiumBlog1, premiumBlog2 })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
