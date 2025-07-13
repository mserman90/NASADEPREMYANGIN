"use server"

interface EarthquakeFeature {
  geometry: {
    coordinates: [number, number, number] // [longitude, latitude, depth]
  }
  properties: {
    mag: number
    place: string
    time: number // Unix timestamp in milliseconds
    url: string
    // Diğer özellikler...
  }
}

interface EarthquakeGeoJSON {
  features: EarthquakeFeature[]
}

interface DisasterLocation {
  lat: number
  lon: number
  type: string // Örneğin: "earthquake", "fire", "flood"
  name?: string // Afet noktası için isteğe bağlı isim (yer)
  magnitude?: number // Depremlere özgü
  time?: number // Unix timestamp
  url?: string // Detay linki
}

export async function getEarthquakes(): Promise<DisasterLocation[]> {
  const startTime = new Date()
  startTime.setDate(startTime.getDate() - 7) // Son 7 günün depremleri

  const endTime = new Date()

  const startDateString = startTime.toISOString().split("T")[0]
  const endDateString = endTime.toISOString().split("T")[0]

  // USGS API'sinden son 7 gün içindeki 2.5 ve üzeri büyüklükteki depremleri çek
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDateString}&endtime=${endDateString}&minmagnitude=2.5`

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }) // Her saatte bir yeniden doğrula
    if (!response.ok) {
      console.error(`USGS API hatası: ${response.status} ${response.statusText}`)
      return []
    }
    const data: EarthquakeGeoJSON = await response.json()

    // Verileri DisasterLocation formatına dönüştür
    const earthquakes: DisasterLocation[] = data.features.map((feature) => ({
      lat: feature.geometry.coordinates[1], // Latitude
      lon: feature.geometry.coordinates[0], // Longitude
      type: "Deprem",
      name: feature.properties.place,
      magnitude: feature.properties.mag,
      time: feature.properties.time,
      url: feature.properties.url,
    }))

    return earthquakes
  } catch (error) {
    console.error("Deprem verileri çekilirken hata oluştu:", error)
    return []
  }
}
