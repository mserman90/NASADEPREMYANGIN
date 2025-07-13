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
  type: string // Örneğin: "earthquake", "fire", "flood"
  name?: string // Afet noktası için isteğe bağlı isim (yer)
  magnitude?: number // Depremlere özgü
  time?: number // Unix timestamp (deprem veya yangın için)
  url?: string // Detay linki
  brightness?: number // Yangınlara özgü
  confidence?: string // Yangınlara özgü
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
    // Yandex Haritalar API'sini dinamik olarak yükle
    const script = document.createElement("script")
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=tr_TR`
    script.type = "text/javascript"
    script.async = true
    script.onload = () => {
      // API yüklendikten sonra haritayı başlat
      if (window.ymaps) {
        window.ymaps.ready(() => {
          if (mapContainerRef.current) {
            const myMap = new window.ymaps.Map(mapContainerRef.current, {
              center: center,
              zoom: zoom,
              controls: ["zoomControl", "fullscreenControl"],
            })
            mapInstanceRef.current = myMap // Harita örneğini sakla

            // Önceki işaretçileri temizle (eğer varsa)
            myMap.geoObjects.removeAll()

            // Afet noktalarını haritaya ekle
            if (disasters && disasters.length > 0) {
              disasters.forEach((disaster) => {
                let balloonContent = `<strong>${disaster.type}</strong><br/>`
                if (disaster.name) balloonContent += `Yer: ${disaster.name}<br/>`

                if (disaster.type === "Deprem") {
                  if (disaster.magnitude) balloonContent += `Büyüklük: ${disaster.magnitude}<br/>`
                } else if (disaster.type === "Yangın") {
                  if (disaster.brightness) balloonContent += `Parlaklık: ${disaster.brightness}K<br/>`
                  if (disaster.confidence) balloonContent += `Güven: ${disaster.confidence}<br/>`
                }

                if (disaster.time) {
                  const date = new Date(disaster.time)
                  balloonContent += `Zaman: ${date.toLocaleString()}<br/>`
                }
                if (disaster.url) {
                  balloonContent += `<a href="${disaster.url}" target="_blank" rel="noopener noreferrer">Detaylar</a>`
                }

                let presetIcon = "islands#blueDotIcon" // Varsayılan
                if (disaster.type === "Deprem") {
                  presetIcon = "islands#redDotIcon"
                } else if (disaster.type === "Yangın") {
                  // Yangınlar için turuncu veya sarı bir ikon kullanabiliriz
                  presetIcon = "islands#orangeDotIcon"
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

    // Bileşen kaldırıldığında script'i ve haritayı temizle
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy() // Haritayı yok et
      }
      document.head.removeChild(script)
    }
  }, [apiKey, center, zoom, disasters]) // disasters prop'unu bağımlılıklara ekle

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg"
      aria-label="Yandex Haritası"
    />
  )
}
