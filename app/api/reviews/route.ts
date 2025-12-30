

// // import { NextResponse } from "next/server"
// // import { jwtVerify } from "jose"
// // import { prisma } from "@/lib/prisma"

// // export async function POST(request: Request) {
// //   try {
// //     const authHeader = request.headers.get("authorization")
// //     if (!authHeader || !authHeader.startsWith("Bearer ")) {
// //       return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
// //     }

// //     const token = authHeader.substring(7)
// //     const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
// //     const userId = payload.id as string

// //     const { tripId, rating, reviewType, comment, reviewedUserId } = await request.json()

// //     if (!tripId || !rating || !reviewType) {
// //       return NextResponse.json({ error: "Trip ID, rating, and review type are required" }, { status: 400 })
// //     }

// //     if (reviewType === "BUDDY" && !reviewedUserId) {
// //       return NextResponse.json({ error: "Reviewed user ID is required for buddy reviews" }, { status: 400 })
// //     }

// //     // Check if user participated in the trip
// //     const participant = await prisma.tripParticipant.findUnique({
// //       where: {
// //         userId_tripId: {
// //           userId,
// //           tripId,
// //         },
// //       },
// //     })

// //     if (!participant) {
// //       return NextResponse.json({ error: "You can only review trips you participated in" }, { status: 403 })
// //     }

// //     if (reviewType === "BUDDY") {
// //       const reviewedParticipant = await prisma.tripParticipant.findUnique({
// //         where: {
// //           userId_tripId: {
// //             userId: reviewedUserId,
// //             tripId,
// //           },
// //         },
// //       })

// //       if (!reviewedParticipant) {
// //         return NextResponse.json(
// //           { error: "You can only review users who participated in the same trip" },
// //           { status: 403 },
// //         )
// //       }
// //     }

// //     let review
// //     if (reviewType === "BUDDY") {
// //       review = await prisma.review.upsert({
// //         where: {
// //           userId_reviewedUserId_tripId: {
// //             userId,
// //             reviewedUserId,
// //             tripId,
// //           },
// //         },
// //         update: {
// //           rating,
// //           comment,
// //         },
// //         create: {
// //           userId,
// //           tripId,
// //           reviewedUserId,
// //           rating,
// //           reviewType,
// //           comment,
// //         },
// //       })
// //     } else {
// //       review = await prisma.review.upsert({
// //         where: {
// //           userId_tripId_reviewType: {
// //             userId,
// //             tripId,
// //             reviewType,
// //           },
// //         },
// //         update: {
// //           rating,
// //           comment,
// //         },
// //         create: {
// //           userId,
// //           tripId,
// //           rating,
// //           reviewType,
// //           comment,
// //         },
// //       })
// //     }

// //     return NextResponse.json(review)
// //   } catch (error) {
// //     console.error("Review API error:", error)
// //     return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
// //   }
// // }


// import { NextResponse } from "next/server";
// import { jwtVerify } from "jose";
// import { prisma } from "@/lib/prisma";

// export async function POST(request: Request) {
//   try {
//     const authHeader = request.headers.get("authorization");
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     const token = authHeader.substring(7);
//     const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""));
//     const userId = payload.id as string;

//     const body = await request.json();
//     const { tripId, rating, reviewType, comment = "", reviewedUserId } = body;

//     console.log("Review request:", { userId, tripId, rating, reviewType, reviewedUserId, comment });

//     if (!tripId || !rating || !reviewType) {
//       return NextResponse.json({ error: "Trip ID, rating, and review type are required" }, { status: 400 });
//     }

//     if (reviewType === "BUDDY" && !reviewedUserId) {
//       return NextResponse.json({ error: "Reviewed user ID is required for buddy reviews" }, { status: 400 });
//     }

//     const participant = await prisma.tripParticipant.findUnique({
//       where: {
//         userId_tripId: {
//           userId,
//           tripId,
//         },
//       },
//     });

//     if (!participant) {
//       console.error("User not a participant:", { userId, tripId });
//       return NextResponse.json({ error: "You can only review trips you participated in" }, { status: 403 });
//     }

//     if (reviewType === "BUDDY") {
//       const reviewedParticipant = await prisma.tripParticipant.findUnique({
//         where: {
//           userId_tripId: {
//             userId: reviewedUserId,
//             tripId,
//           },
//         },
//       });

//       if (!reviewedParticipant) {
//         console.error("Reviewed user not a participant:", { reviewedUserId, tripId });
//         return NextResponse.json(
//           { error: "You can only review users who participated in the same trip" },
//           { status: 403 },
//         );
//       }
//     }

//     let review;
//     if (reviewType === "BUDDY") {
//       review = await prisma.review.upsert({
//         where: {
//           userId_reviewedUserId_tripId: { // Use correct constraint for BUDDY reviews
//             userId,
//             reviewedUserId: reviewedUserId!,
//             tripId,
//           },
//         },
//         update: {
//           rating,
//           comment: comment || null,
//         },
//         create: {
//           userId,
//           tripId,
//           reviewedUserId: reviewedUserId!,
//           rating,
//           reviewType,
//           comment: comment || null,
//         },
//       });
//     } else {
//       review = await prisma.review.upsert({
//         where: {
//           userId_tripId_reviewType: {
//             userId,
//             tripId,
//             reviewType,
//           },
//         },
//         update: {
//           rating,
//           comment: comment || null,
//         },
//         create: {
//           userId,
//           tripId,
//           rating,
//           reviewType,
//           comment: comment || null,
//         },
//       });
//     }

//     console.log("Review created/updated:", review);
//     return NextResponse.json(review);
//   } catch (error) {
//     console.error("Review API error:", error);
//     return NextResponse.json({ error: "Failed to create or update review", details: error.message }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
    const userId = payload.id as string

    const body = await request.json()
    const { tripId, rating, reviewType, comment = "", reviewedUserId } = body

    if (!tripId || typeof rating !== "number" || !reviewType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    if (reviewType === "TRIP") {
      const review = await prisma.tripReview.upsert({
        where: { tripId_reviewerId: { tripId, reviewerId: userId } },
        update: { rating, comment },
        create: { tripId, reviewerId: userId, rating, comment },
      })
      return NextResponse.json({ ok: true, review })
    }

    if (reviewType === "BUDDY") {
      if (!reviewedUserId) {
        return NextResponse.json({ error: "Missing reviewedUserId" }, { status: 400 })
      }
      const review = await prisma.buddyReview.upsert({
        where: { tripId_reviewerId_buddyId: { tripId, reviewerId: userId, buddyId: reviewedUserId } },
        update: { rating, comment },
        create: { tripId, reviewerId: userId, buddyId: reviewedUserId, rating, comment },
      })
      return NextResponse.json({ ok: true, review })
    }

    return NextResponse.json({ error: "Invalid reviewType" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: "Failed to create or update review" }, { status: 500 })
  }
}
