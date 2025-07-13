"use server"

interface DisasterLocation {
  lat: number
  lon: number
  type: string // "Yangın"
  name?: string // Bilgi balonunda gösterilecek yer adı
  time?: number // Unix timestamp (ms)
  url?: string // Ayrıntı bağlantısı
  brightness?: number // VIIRS parlaklık değerleri (Kelvin)
  confidence?: string // FIRMS güven seviyesi
  frp?: number // Ateş radyatif gücü
}

/**
 * Basit CSV ayrıştırıcı – tırnaklı değerler beklenmez, FIRMS çıktısı düz virgül-ayrılmıştır.
 */
function parseCsv(text: string): Record<string, string>[] {
  const [headerLine, ...rows] = text.trim().split("\n")
  const headers = headerLine.split(",")
  return rows.map((row) => {
    const cols = row.split(",")
    return headers.reduce<Record<string, string>>((acc, header, idx) => {
      acc[header] = cols[idx]
      return acc
    }, {})
  })
}

export async function getFirmsFires(): Promise<DisasterLocation[]> {
  // 1️⃣   Yerel ön-izleme için literal anahtar; prod’da Vercel env var kullanın.
  const FIRMS_API_KEY = process.env.FIRMS_API_KEY ?? "0c1a9381081313d1f26c10984f204d63"

  if (!FIRMS_API_KEY) {
    console.error("FIRMS_API_KEY ortam değişkeni ayarlanmamış.")
    return []
  }

  // VIIRS-SNPP, dünya geneli, son 24 saat
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_API_KEY}/VIIRS_SNPP_NRT/world/1`

  try {
    const response = await fetch(url, { next: { revalidate: 300 } })
    const csvText = await response.text()

    // FIRMS “no data” durumunda da CSV döndürür; JSON beklemediğimiz için parse hatası olmayacak
    if (!csvText || csvText.startsWith("<")) {
      console.error("FIRMS API beklenmedik çıktı gönderdi.")
      return []
    }

    const records = parseCsv(csvText)

    const fires: DisasterLocation[] = records.map((rec) => {
      const date = rec.acq_date // YYYY-MM-DD
      const time = rec.acq_time.padStart(4, "0") // HHMM
      const iso = `${date}T${time.slice(0, 2)}:${time.slice(2)}:00Z`
      const ts = Date.parse(iso)

      return {
        lat: Number(rec.latitude),
        lon: Number(rec.longitude),
        type: "Yangın",
        name: `Yangın (Güven: ${rec.confidence})`,
        brightness: Number(rec.brightness),
        confidence: rec.confidence,
        frp: Number(rec.frp),
        time: isNaN(ts) ? undefined : ts,
        url: `https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@${rec.latitude},${rec.longitude},10z`,
      }
    })

    return fires
  } catch (err) {
    console.error("FIRMS yangın verileri çekilirken hata oluştu:", err)
    return []
  }
}
