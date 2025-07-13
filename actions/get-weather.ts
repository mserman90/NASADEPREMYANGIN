"use server"

interface WeatherData {
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
  }
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  name: string // City name
  dt: number // Unix timestamp
  coord: {
    lat: number
    lon: number
  }
}

interface DisasterLocation {
  lat: number
  lon: number
  type: string // "Deprem", "Yangın", "Hava Durumu"
  name?: string // Afet noktası için isteğe bağlı isim (yer) / Hava durumu açıklaması
  magnitude?: number // Depremlere özgü
  time?: number // Unix timestamp
  url?: string // Detay linki
  brightness?: number // Yangınlara özgü
  confidence?: string // Yangınlara özgü
  temperature?: number // Hava durumuna özgü (Celsius)
  weatherIcon?: string // Hava durumu ikonu kodu
}

export async function getOpenWeatherMapWeather(lat: number, lon: number): Promise<DisasterLocation | null> {
  // 1️⃣ Yerel ön-izleme için literal anahtar; prod’da Vercel env var kullanın.
  const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY ?? "62bc64d515f8934e1a20f8c23268df81"

  if (!OPENWEATHERMAP_API_KEY) {
    console.error("OPENWEATHERMAP_API_KEY ortam değişkeni ayarlanmamış.")
    return null
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=metric&lang=tr`

  try {
    const response = await fetch(url, { next: { revalidate: 600 } }) // Her 10 dakikada bir yeniden doğrula
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`OpenWeatherMap API hatası: ${response.status} ${response.statusText} - ${errorText}`)
      return null
    }
    const data: WeatherData = await response.json()

    return {
      lat: data.coord.lat,
      lon: data.coord.lon,
      type: "Hava Durumu",
      name: `${data.name}: ${data.weather[0].description}`,
      temperature: data.main.temp,
      weatherIcon: data.weather[0].icon,
      time: data.dt * 1000, // Unix timestamp'i milisaniyeye çevir
      url: `https://openweathermap.org/city/${data.id}`, // Şehir ID'si ile detay linki
    }
  } catch (error) {
    console.error("Hava durumu verileri çekilirken hata oluştu:", error)
    return null
  }
}
