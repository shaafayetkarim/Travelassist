
"use client"
import React, { useState } from "react"
import { MapPin, Calendar, Star } from "lucide-react"


const API_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;



export default function Hotel() {
  const today = new Date().toISOString().split("T")[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]

  const [searchData, setSearchData] = useState({
    destination: "",
    checkIn: today,
    checkOut: tomorrow,
  })

  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchData((prev) => ({ ...prev, [name]: value }))
  }

  const searchLocation = async (query) => {
    const response = await fetch(
      `https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchLocation?query=${encodeURIComponent(query)}`,
      { headers: { "x-rapidapi-key": API_KEY } }
    )
    const data = await response.json()
    return data.data?.[0]?.geoId || null
  }

  const searchHotels = async (geoId) => {
    const response = await fetch(
      `https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotels?geoId=${geoId}&checkIn=${searchData.checkIn}&checkOut=${searchData.checkOut}&pageNumber=1&adults=1&currencyCode=USD`,
      { headers: { "x-rapidapi-key": API_KEY } }
    )
    const data = await response.json()
    return data.data?.data || []
  }

  const handleSearch = async (e) => {
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
    } catch (err) {
      console.error(err)
      setError(err.message || "Failed to search hotels")
    } finally {
      setLoading(false)
    }
  }

  const getHotelImage = (hotel) => {
    if (hotel.cardPhotos?.length > 0) {
      const photo = hotel.cardPhotos[0]
      if (photo.sizes?.urlTemplate) {
        return photo.sizes.urlTemplate
          .replace("{width}", "400")
          .replace("{height}", "300")
      }
    }
    return "/placeholder.svg"
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Hotel Booking</h1>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="destination"
                value={searchData.destination}
                onChange={handleInputChange}
                placeholder="Where to?"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Check-in */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                name="checkIn"
                value={searchData.checkIn}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Check-out */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                name="checkOut"
                value={searchData.checkOut}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="w-full mt-4 bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-400"
        >
          {loading ? "Searching..." : "Search Hotels"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Searching for hotels...</p>
        </div>
      )}

      <div className="grid gap-6">
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            className="bg-white rounded-lg shadow-sm border overflow-hidden"
          >
            <div className="md:flex">
              <div className="md:w-1/3">
                <img
                  src={getHotelImage(hotel)}
                  alt={hotel.title}
                  className="w-full h-48 md:h-full object-cover"
                />
              </div>
              <div className="md:w-2/3 p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {hotel.title}
                  </h3>
                  {hotel.bubbleRating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">
                        {hotel.bubbleRating.rating} {hotel.bubbleRating.count}
                      </span>
                    </div>
                  )}
                </div>

                {hotel.primaryInfo && (
                  <p className="text-sm text-gray-600 mb-2">
                    {hotel.primaryInfo}
                  </p>
                )}

                {hotel.badge?.type && (
                  <div className="mb-4">
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      {hotel.badge.type.replace("_", " ")} {hotel.badge.year}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div>
                    {hotel.commerceInfo?.priceForDisplay?.text && (
                      <>
                        <span className="text-2xl font-bold text-gray-900">
                          {hotel.commerceInfo.priceForDisplay.text}
                        </span>
                        <span className="text-gray-600"> / night</span>
                      </>
                    )}
                    {hotel.commerceInfo?.provider && (
                      <p className="text-sm text-gray-500">
                        via {hotel.commerceInfo.provider}
                      </p>
                    )}
                  </div>
                  {hotel.commerceInfo?.externalUrl && (
                    <a
                      href={hotel.commerceInfo.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Book Now
                    </a>
                  )}
                </div>

                {hotel.commerceInfo?.details?.text && (
                  <p className="text-sm text-green-600 mt-2">
                    {hotel.commerceInfo.details.text}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hotels.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          <p>Enter a destination and search for hotels</p>
        </div>
      )}
    </div>
  )
}
