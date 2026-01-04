
"use client"
import React, { useState } from "react"
import { MapPin, Calendar, Star } from "lucide-react"


const API_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;

interface HotelData {
  id: string;
  title: string;
  cardPhotos: {
    sizes: {
      urlTemplate: string;
    };
  }[];
  bubbleRating?: {
    rating: number;
    count: string;
  };
  primaryInfo?: string;
  badge?: {
    type: string;
    year: string;
  };
  commerceInfo?: {
    priceForDisplay?: {
      text: string;
    };
    provider?: string;
    externalUrl?: string;
    details?: {
      text: string;
    };
  };
}

export default function Hotel() {
  const today = new Date().toISOString().split("T")[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]

  const [searchData, setSearchData] = useState({
    destination: "",
    checkIn: today,
    checkOut: tomorrow,
  })

  const [hotels, setHotels] = useState<HotelData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSearchData((prev) => ({ ...prev, [name]: value }))
  }

  const searchLocation = async (query: string) => {
    const response = await fetch(
      `https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchLocation?query=${encodeURIComponent(query)}`,
      { headers: { "x-rapidapi-key": API_KEY || "" } }
    )
    const data = await response.json()
    return data.data?.[0]?.geoId || null
  }

  const searchHotels = async (geoId: string) => {
    const response = await fetch(
      `https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotels?geoId=${geoId}&checkIn=${searchData.checkIn}&checkOut=${searchData.checkOut}&pageNumber=1&adults=1&currencyCode=USD`,
      { headers: { "x-rapidapi-key": API_KEY || "" } }
    )
    const data = await response.json()
    return data.data?.data || []
  }

  const handleSearch = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!searchData.destination.trim()) {
      setError("Please enter a destination")
      return
    }

    setLoading(true)
    setError("")
    setHotels([])

    try {
      const geoId = await searchLocation(searchData.destination)
      if (!geoId) throw new Error("Location not found")

      const hotelResults = await searchHotels(geoId)
      if (hotelResults.length === 0) throw new Error("No hotels found")

      setHotels(hotelResults)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to search hotels")
    } finally {
      setLoading(false)
    }
  }

  const getHotelImage = (hotel: HotelData) => {
    if (hotel.cardPhotos?.length > 0) {
      const photo = hotel.cardPhotos[0]
      if (photo.sizes?.urlTemplate) {
        return photo.sizes.urlTemplate
          .replace("{width}", "800")
          .replace("{height}", "600")
      }
    }
    return "/placeholder.svg"
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-gradient mb-4">Elite Stays</h1>
        <p className="text-white/40 text-sm font-medium">Curated accommodations for the modern traveler.</p>
      </div>

      <div className="glass-card mb-12 border-primary/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Destination</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                name="destination"
                value={searchData.destination}
                onChange={handleInputChange}
                placeholder="Where to?"
                className="glass-input w-full pl-12 h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Check-in</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input
                type="date"
                name="checkIn"
                value={searchData.checkIn}
                onChange={handleInputChange}
                className="glass-input w-full pl-12 h-12 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Check-out</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input
                type="date"
                name="checkOut"
                value={searchData.checkOut}
                onChange={handleInputChange}
                className="glass-input w-full pl-12 h-12 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="glass-button bg-primary text-white border-primary/20 w-full h-14 text-base font-bold mt-8 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing Options...
            </span>
          ) : "Search Accommodations"}
        </button>
      </div>

      {error && (
        <div className="glass-card bg-red-500/5 border-red-500/20 text-red-400 text-sm font-medium px-6 py-4 rounded-2xl mb-12 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          {error}
        </div>
      )}

      {loading && hotels.length === 0 && (
        <div className="grid gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card h-64 animate-pulse border-white/5" />
          ))}
        </div>
      )}

      <div className="grid gap-8">
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            className="glass-card group p-0 overflow-hidden hover:border-primary/30 transition-all duration-500"
          >
            <div className="md:flex h-full">
              <div className="md:w-2/5 relative overflow-hidden">
                <img
                  src={getHotelImage(hotel)}
                  alt={hotel.title}
                  className="w-full h-64 md:h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="md:w-3/5 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">
                      {hotel.title}
                    </h3>
                    {hotel.bubbleRating && (
                      <div className="flex items-center gap-1.5 bg-white/5 py-1.5 px-3 rounded-full border border-white/10 shadow-lg">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 shadow-amber-400" />
                        <span className="text-sm font-bold text-white">
                          {hotel.bubbleRating.rating}
                        </span>
                        <span className="text-xs text-white/40 font-medium">({hotel.bubbleRating.count})</span>
                      </div>
                    )}
                  </div>

                  {hotel.primaryInfo && (
                    <p className="text-white/40 text-sm font-medium leading-relaxed mb-6">
                      {hotel.primaryInfo}
                    </p>
                  )}

                  {hotel.badge?.type && (
                    <div className="mb-6">
                      <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-primary/20">
                        {hotel.badge.type.replace("_", " ")} {hotel.badge.year}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <div className="space-y-1">
                    {hotel.commerceInfo?.priceForDisplay?.text && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white tracking-tight">
                          {hotel.commerceInfo.priceForDisplay.text}
                        </span>
                        <span className="text-white/40 text-xs font-bold uppercase tracking-widest">/ night</span>
                      </div>
                    )}
                    {hotel.commerceInfo?.provider && (
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                        via {hotel.commerceInfo.provider}
                      </p>
                    )}
                  </div>
                  {hotel.commerceInfo?.externalUrl && (
                    <a
                      href={hotel.commerceInfo.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-button bg-white text-black border-transparent hover:bg-white/90 px-8 h-12 text-sm font-black shadow-xl"
                    >
                      Reserve
                    </a>
                  )}
                </div>

                {hotel.commerceInfo?.details?.text && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">
                      {hotel.commerceInfo.details.text}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hotels.length === 0 && !loading && !error && (
        <div className="glass-card py-24 text-center border-white/5">
          <div className="flex flex-col items-center gap-6 opacity-30">
            <MapPin className="w-12 h-12" />
            <p className="font-bold tracking-[0.2em] uppercase text-sm">Awaiting destination details</p>
          </div>
        </div>
      )}
    </div>
  )
}

