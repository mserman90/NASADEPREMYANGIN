"use client"

import { useEffect, useState, useMemo } from "react"
import YandexMap from "../components/yandex-map"
import { getEarthquakes } from "../actions/get-earthquakes"
import { getFirmsFires } from "../actions/get-firms-fires"
import { getOpenWeatherMapWeather } from "../actions/get-weather" // Yeni import
import { getStaticYandexMap } from "../actions/get-static-yandex-map"

interface DisasterLocation {
  lat: number
  lon: number
  type: string
  name?: string
  magnitude?: number
  time?: number
  url?: string
  brightness?: number
  confidence?: string
  temperature?: number // Yeni eklenen alan
  weatherIcon?: string // Yeni eklenen alan
}

export default function Page() {
  const YANDEX_MAPS_API_KEY = "1720256-db64-454d-928c-072bf5959ebc"
  const [allDisasters, setAllDisasters] = useState<DisasterLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEarthquakes, setShowEarthquakes] = useState(true)
  const [showFires, setShowFires] = useState(true)
  const [showWeather, setShowWeather] = useState(true) // Yeni state
  const [staticMapImage, setStaticMapImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchDisasterData = async () => {
      try {
        setLoading(true)
        const [earthquakeData, fireData, weatherData] = await Promise.all([
          // weatherData'yı ekle
          getEarthquakes(),
          getFirmsFires(),
          getOpenWeatherMapWeather(39.9334, 32.8597), // Ankara'nın koordinatları
        ])

        const combinedData: DisasterLocation[] = [...earthquakeData, ...fireData]
        if (weatherData) {
          combinedData.push(weatherData)
        }
        setAllDisasters(combinedData)

        const staticMap = await getStaticYandexMap({
          center: [35.0, 39.0],
          zoom: 4,
          size: [400, 250],
          markers: [
            { lat: 39.9334, lon: 32.8597, color: "pmgnm" },
            { lat: 41.0082, lon: 28.9784, color: "pmbll" },
          ],
        })
        setStaticMapImage(staticMap)
      } catch (err) {
        console.error("Afet verileri çekilirken hata:", err)
        setError("Afet verileri yüklenirken bir hata oluştu.")
      } finally {
        setLoading(false)
      }
    }

    fetchDisasterData()
  }, [])

  const filteredDisasters = useMemo(() => {
    return allDisasters.filter((disaster) => {
      if (disaster.type === "Deprem" && !showEarthquakes) {
        return false
      }
      if (disaster.type === "Yangın" && !showFires) {
        return false
      }
      if (disaster.type === "Hava Durumu" && !showWeather) {
        // Yeni filtre
        return false
      }
      return true
    })
  }, [allDisasters, showEarthquakes, showFires, showWeather]) // showWeather'ı bağımlılıklara ekle

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Afet verileri yükleniyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Yandex Haritalar - Depremler, Yangınlar ve Hava Durumu</h1>

      <div className="flex gap-4 mb-4 p-3 bg-white rounded-lg shadow-md">
        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="checkbox"
            checked={showEarthquakes}
            onChange={(e) => setShowEarthquakes(e.target.checked)}
            className="form-checkbox h-5 w-5 text-red-600 rounded"
          />
          Depremleri Göster (Kırmızı)
        </label>
        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="checkbox"
            checked={showFires}
            onChange={(e) => setShowFires(e.target.checked)}
            className="form-checkbox h-5 w-5 text-orange-500 rounded"
          />
          Yangınları Göster (Turuncu)
        </label>
        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="checkbox"
            checked={showWeather}
            onChange={(e) => setShowWeather(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600 rounded" // Mavi renk
          />
          Hava Durumunu Göster (Mavi)
        </label>
      </div>

      <YandexMap apiKey={YANDEX_MAPS_API_KEY} center={[39.0, 35.0]} zoom={6} disasters={filteredDisasters} />

      {staticMapImage && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Statik Harita Önizlemesi</h2>
          <img src={staticMapImage || "/placeholder.svg"} alt="Statik Yandex Haritası" className="rounded-lg" />
          <p className="mt-2 text-sm text-gray-600">Bu, Yandex Static Maps API'sinden çekilen bir görüntüdür.</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-white rounded-lg shadow-md text-sm text-gray-600">
        <h2 className="font-semibold mb-2">Lejant:</h2>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-4 h-4 bg-red-500 rounded-full inline-block"></span>
          <span>Deprem (USGS Verileri)</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-4 h-4 bg-orange-500 rounded-full inline-block"></span>
          <span>Yangın (NASA FIRMS Verileri)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-blue-500 rounded-full inline-block"></span>
          <span>Hava Durumu (OpenWeatherMap Verileri)</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-600">
        Bu harita USGS tarafından sağlanan son deprem verilerini, NASA FIRMS tarafından sağlanan aktif yangın verilerini
        ve OpenWeatherMap tarafından sağlanan güncel hava durumu verilerini göstermektedir.
      </p>
    </div>
  )
}
