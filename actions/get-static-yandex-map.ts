"use server"

interface StaticMapParams {
  center?: [number, number] // [longitude, latitude]
  zoom?: number
  size?: [number, number] // [width, height]
  markers?: { lat: number; lon: number; color?: string }[]
}

export async function getStaticYandexMap(params: StaticMapParams): Promise<string | null> {
  const RAPIDAPI_KEY =
    process.env.RAPIDAPI_YANDEX_STATIC_MAP_KEY ?? "e959f7813dmshf6c015e10f9d344p122dd0jsn8535aadbefe1" // Ön-izleme için fallback

  if (!RAPIDAPI_KEY) {
    console.error("RAPIDAPI_YANDEX_STATIC_MAP_KEY ortam değişkeni ayarlanmamış.")
    return null
  }

  const host = "yandexstaticraygorodskijv1.p.rapidapi.com"
  const path = "/getStaticMap"

  // Parametreleri URL kodlu form verisine dönüştür
  const formData = new URLSearchParams()
  if (params.center) {
    formData.append("ll", `${params.center[0]},${params.center[1]}`) // longitude,latitude
  }
  if (params.zoom) {
    formData.append("z", params.zoom.toString())
  }
  if (params.size) {
    formData.append("size", `${params.size[0]},${params.size[1]}`)
  }
  if (params.markers && params.markers.length > 0) {
    const markerStrings = params.markers.map(
      (m) => `${m.lon},${m.lat},pm${m.color || "blm"}`, // longitude,latitude,style
    )
    formData.append("pt", markerStrings.join("~"))
  }
  formData.append("l", "map") // Harita katmanı tipi (map, sat, skl)

  try {
    const response = await fetch(`https://${host}${path}`, {
      method: "POST",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": host,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      next: { revalidate: 3600 }, // Her saatte bir yeniden doğrula
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`RapidAPI hatası: ${response.status} ${response.statusText} - ${errorText}`)
      return null
    }

    // API doğrudan bir resim döndürdüğü için, base64 olarak kodlayıp döndürelim
    const imageBuffer = await response.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString("base64")
    return `data:${response.headers.get("Content-Type")};base64,${base64Image}`
  } catch (error) {
    console.error("Statik Yandex Haritası çekilirken hata oluştu:", error)
    return null
  }
}
