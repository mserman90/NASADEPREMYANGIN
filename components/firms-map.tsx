"use client"

import { GoogleMapsEmbed } from "@next/third-parties/google"

export default function FIRMSMap() {
  // Bu harita, genel bir yangın riski bölgesini temsil eden bir yer tutucudur.
  // Gerçek zamanlı FIRMS verilerini doğrudan bu bileşene entegre etmek için
  // daha gelişmiş haritalama kütüphaneleri ve FIRMS API entegrasyonu gereklidir.
  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      <GoogleMapsEmbed
        apiKey="AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg" // Kendi Google Maps API anahtarınızı buraya ekleyin
        height="100%"
        width="100%"
        mode="place"
        q="California Wildfires" // Yangın riski olan genel bir bölge veya ilgi alanı
        zoom={6}
        language="tr"
        loading="lazy"
      />
    </div>
  )
}
