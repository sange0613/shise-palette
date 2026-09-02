import { readableTextColor } from './color-utils'

const roundRect = (context, x, y, width, height, radius) => {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.fill()
}

const drawContainedImage = (context, image, x, y, width, height) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2
  context.save()
  context.beginPath()
  context.roundRect(x, y, width, height, 24)
  context.clip()
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
  context.restore()
}

export const downloadPalette = ({ image, colors, fileName }) => new Promise((resolve, reject) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1600
  canvas.height = 1100
  const context = canvas.getContext('2d')

  context.fillStyle = '#F7F7F4'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#151515'
  context.font = '700 72px system-ui, sans-serif'
  context.fillText('拾色', 100, 122)
  context.font = '400 28px system-ui, sans-serif'
  context.fillStyle = '#656565'
  context.fillText('从一张图片，找到它的五种颜色', 100, 170)
  context.fillStyle = '#D3D3CE'
  context.fillRect(100, 216, 1400, 2)

  drawContainedImage(context, image, 100, 280, 1400, 500)

  const gap = 16
  const swatchWidth = (1400 - gap * 4) / 5
  colors.forEach((color, index) => {
    const x = 100 + index * (swatchWidth + gap)
    context.fillStyle = color
    roundRect(context, x, 830, swatchWidth, 150, 16)
    context.fillStyle = readableTextColor(color)
    context.font = '600 28px ui-monospace, SFMono-Regular, Menlo, monospace'
    context.fillText(color, x + 22, 925)
  })

  context.fillStyle = '#777772'
  context.font = '400 22px system-ui, sans-serif'
  context.fillText('由拾色在本地生成', 100, 1045)

  canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error('无法生成色卡文件'))
      return
    }
    const link = document.createElement('a')
    const safeName = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9\u4e00-\u9fa5-_]/g, '-')
    const downloadUrl = URL.createObjectURL(blob)
    link.download = `${safeName || 'palette'}-色卡.png`
    link.href = downloadUrl
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
    resolve()
  }, 'image/png')
})
