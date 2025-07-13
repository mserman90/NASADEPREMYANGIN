"use client"

import { useEffect, useRef } from "react"

// Yandex Haritalar API'si için global ymaps tür tanımlaması
declare global {
  interface Window {
    ymaps: any
  }
}

interface DisasterLocation {
  lat: number
  lon: number
  type: string // Örneğin: "earthquake", "fire", "flood", "weather"
  name?: string // Afet noktası için isteğe bağlı isim (yer)
  magnitude?: number // Depremlere özgü
  time?: number // Unix timestamp (deprem veya yangın için)
  url?: string // Detay linki
  brightness?: number // Yangınlara özgü
  confidence?: string // Yangınlara özgü
  temperature?: number // Hava durumuna özgü
  weatherIcon?: string // Hava durumu ikonu kodu
}

interface YandexMapProps {
  apiKey: string
  center: [number, number] // [latitude, longitude]
  zoom: number
  disasters?: DisasterLocation[] // Afet verileri
}

export default function YandexMap({ apiKey, center, zoom, disasters }: YandexMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null) // Harita örneğini saklamak için

  useEffect(() => {
    const script = document.createElement("script")
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=tr_TR`
    script.type = "text/javascript"
    script.async = true
    script.onload = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => {
          if (mapContainerRef.current) {
            const myMap = new window.ymaps.Map(mapContainerRef.current, {
              center: center,
              zoom: zoom,
              controls: ["zoomControl", "fullscreenControl"],
            })
            mapInstanceRef.current = myMap

            myMap.geoObjects.removeAll()

            if (disasters && disasters.length > 0) {
              disasters.forEach((disaster) => {
                let balloonContent = `<strong>${disaster.type}</strong><br/>`
                if (disaster.name) balloonContent += `Yer: ${disaster.name}<br/>`

                let presetIcon = "islands#blueDotIcon" // Varsayılan

                if (disaster.type === "Deprem") {
                  if (disaster.magnitude) balloonContent += `Büyüklük: ${disaster.magnitude}<br/>`
                  presetIcon = "islands#redDotIcon"
                } else if (disaster.type === "Yangın") {
                  if (disaster.brightness) balloonContent += `Parlaklık: ${disaster.brightness}K<br/>`
                  if (disaster.confidence) balloonContent += `Güven: ${disaster.confidence}<br/>`
                  presetIcon = "islands#orangeDotIcon"
                } else if (disaster.type === "Hava Durumu") {
                  // Yeni hava durumu tipi
                  if (disaster.temperature !== undefined) balloonContent += `Sıcaklık: ${disaster.temperature}°C<br/>`
                  if (disaster.weatherIcon) {
                    // OpenWeatherMap ikonunu göstermek için bir resim etiketi ekleyebiliriz
                    balloonContent += `<img src="https://openweathermap.org/img/wn/${disaster.weatherIcon}.png" alt="Hava Durumu İkonu" style="vertical-align: middle; margin-right: 5px;"/><br/>`
                  }
                  presetIcon = "islands#blueDotIcon" // Hava durumu için mavi ikon
                }

                if (disaster.time) {
                  const date = new Date(disaster.time)
                  balloonContent += `Zaman: ${date.toLocaleString()}<br/>`
                }
                if (disaster.url) {
                  balloonContent += `<a href="${disaster.url}" target="_blank" rel="noopener noreferrer">Detaylar</a>`
                }

                const placemark = new window.ymaps.Placemark(
                  [disaster.lat, disaster.lon],
                  {
                    balloonContent: balloonContent,
                    hintContent: `${disaster.type}: ${disaster.name || ""}`,
                  },
                  {
                    preset: presetIcon,
                  },
                )
                myMap.geoObjects.add(placemark)
              })
            }
          }
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
      }
      document.head.removeChild(script)
    }
  }, [apiKey, center, zoom, disasters])

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg"
      aria-label="Yandex Haritası"
    />
  )
}
