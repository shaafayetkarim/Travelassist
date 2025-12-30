
// import { NextResponse } from "next/server"
// import { jwtVerify } from "jose"
// import { prisma } from "@/lib/prisma"

// export async function GET(request: Request) {
//   try {
//     // Get current user from Authorization header
//     const authHeader = request.headers.get("authorization")
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
//     }

//     const token = authHeader.substring(7)
//     const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
//     const userId = payload.id as string

//     // Get completed trips (trips where end date has passed)
//     const completedTrips = await prisma.trip.findMany({
//       where: {
//         participants: {
//           some: {
//             userId: userId,
//           },
//         },
//         endDate: {
//           lt: new Date(),
//         },
//       },
//       select: {
//         id: true,
//         destination: true,
//         endDate: true,
//         reviews: {
//           where: {
//             userId: userId,
//           },
//           select: {
//             rating: true,
//             reviewType: true,
//           },
//         },
//       },
//       orderBy: {
//         endDate: "desc",
//       },
//     })

//     const formattedTrips = completedTrips.map((trip) => ({
//       id: trip.id,
//       destination: trip.destination,
//       date: trip.endDate.toISOString().split("T")[0],
//       rating: trip.reviews.find((r) => r.reviewType === "DESTINATION")?.rating || 0,
//     }))

//     return NextResponse.json(formattedTrips)
//   } catch (error) {
//     console.error("Profile trips API error:", error)
//     return NextResponse.json({ error: "Failed to fetch completed trips" }, { status: 500 })
//   }
// }




// import { NextResponse } from "next/server"
// import { jwtVerify } from "jose"
// import { prisma } from "@/lib/prisma"

// export async function GET(request: Request) {
//   try {
//     // Get current user from Authorization header
//     const authHeader = request.headers.get("authorization")
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
//     }

//     const token = authHeader.substring(7)
//     const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
//     const userId = payload.id as string

//     const completedTrips = await prisma.trip.findMany({
//       where: {
//         participants: {
//           some: {
//             userId: userId,
//           },
//         },
//         endDate: {
//           lt: new Date(),
//         },
//       },
//       select: {
//         id: true,
//         destination: true,
//         endDate: true,
//         participants: {
//           select: {
//             user: {
//               select: {
//                 id: true,
//                 name: true,
//                 avatar: true,
//               },
//             },
//           },
//           where: {
//             userId: {
//               not: userId, // Exclude current user from participants list
//             },
//           },
//         },
//         reviews: {
//           where: {
//             userId: userId,
//           },
//           select: {
//             rating: true,
//             reviewType: true,
//             reviewedUserId: true,
//           },
//         },
//       },
//       orderBy: {
//         endDate: "desc",
//       },
//     })

//     const formattedTrips = completedTrips.map((trip) => ({
//       id: trip.id,
//       destination: trip.destination,
//       date: trip.endDate.toISOString().split("T")[0],
//       rating: trip.reviews.find((r) => r.reviewType === "DESTINATION")?.rating || 0,
//       participants: trip.participants.map((participant) => ({
//         id: participant.user.id,
//         name: participant.user.name,
//         avatar: participant.user.avatar,
//         rating:
//           trip.reviews.find((r) => r.reviewType === "BUDDY" && r.reviewedUserId === participant.user.id)?.rating || 0,
//       })),
//     }))

//     return NextResponse.json(formattedTrips)
//   } catch (error) {
//     console.error("Profile trips API error:", error)
//     return NextResponse.json({ error: "Failed to fetch completed trips" }, { status: 500 })
//   }
// }


// app/api/profile/trips/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
    const userId = String(payload.id)

    const trips = await prisma.trip.findMany({
      where: {
        status: "ENDED",
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        tripReviews: { where: { reviewerId: userId }, select: { rating: true } },
        buddyReviews: { where: { reviewerId: userId }, select: { buddyId: true, rating: true } },
      },
      orderBy: { endDate: "desc" },
    })

    const data = trips.map(t => {
      const myTripRating = t.tripReviews[0]?.rating ?? 0
      const buddies = t.buddyReviews.reduce<Record<string, number>>((m, br) => {
        m[br.buddyId] = br.rating
        return m
      }, {})
      return {
        id: t.id,
        destination: t.destination,
        date: t.endDate,
        rating: myTripRating,
        participants: t.participants
          .filter(p => p.userId !== userId)
          .map(p => ({
            id: p.user.id,
            name: p.user.name,
            avatar: p.user.avatar ?? null,
            rating: buddies[p.user.id] ?? 0,
          })),
      }
    })

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: "Failed to load trips" }, { status: 500 })
  }
}
