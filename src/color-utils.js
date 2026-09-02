const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)))

export const rgbToHex = ([r, g, b]) =>
  `#${[r, g, b].map((value) => clamp(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase()

export const hexToRgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]

const distance = (a, b) => {
  const rMean = (a[0] + b[0]) / 2
  const r = a[0] - b[0]
  const g = a[1] - b[1]
  const bl = a[2] - b[2]
  return (2 + rMean / 256) * r * r + 4 * g * g + (2 + (255 - rMean) / 256) * bl * bl
}

const getHistogram = (data) => {
  const buckets = new Map()
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 160) continue
    const r = data[index]
    const g = data[index + 1]
    const b = data[index + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    // Almost-white and almost-black pixels can dominate borders without representing the photo.
    if ((max > 248 && min > 244) || (max < 8 && min < 8)) continue
    const key = `${r >> 3},${g >> 3},${b >> 3}`
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.count += 1
      bucket.r += r
      bucket.g += g
      bucket.b += b
    } else {
      buckets.set(key, { count: 1, r, g, b })
    }
  }
  return [...buckets.values()]
    .map(({ count, r, g, b }) => ({ color: [r / count, g / count, b / count], count }))
    .sort((a, b) => b.count - a.count)
}

export const extractPalette = (imageData, amount = 5) => {
  const samples = getHistogram(imageData.data)
  if (!samples.length) return ['#D9D9D4', '#B8B8B2', '#8D8D88', '#5F5F5C', '#292928']

  const centroids = [samples[0].color]
  while (centroids.length < amount) {
    let candidate = samples[0]
    let highestScore = -1
    for (const sample of samples.slice(0, 1024)) {
      const nearest = Math.min(...centroids.map((center) => distance(sample.color, center)))
      const score = nearest * Math.sqrt(sample.count)
      if (score > highestScore) {
        highestScore = score
        candidate = sample
      }
    }
    centroids.push(candidate.color)
  }

  let clusterWeights = new Array(amount).fill(0)
  for (let pass = 0; pass < 12; pass += 1) {
    const totals = Array.from({ length: amount }, () => [0, 0, 0, 0])
    for (const sample of samples) {
      let cluster = 0
      let nearest = Infinity
      centroids.forEach((center, index) => {
        const value = distance(sample.color, center)
        if (value < nearest) {
          nearest = value
          cluster = index
        }
      })
      const total = totals[cluster]
      total[0] += sample.color[0] * sample.count
      total[1] += sample.color[1] * sample.count
      total[2] += sample.color[2] * sample.count
      total[3] += sample.count
    }
    clusterWeights = totals.map((total) => total[3])
    totals.forEach((total, index) => {
      if (total[3]) centroids[index] = [total[0] / total[3], total[1] / total[3], total[2] / total[3]]
    })
  }

  return centroids
    .map((color, index) => ({ color, weight: clusterWeights[index] }))
    .sort((a, b) => b.weight - a.weight)
    .map(({ color }) => rgbToHex(color))
}

export const readableTextColor = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.46 ? '#171717' : '#FFFFFF'
}
