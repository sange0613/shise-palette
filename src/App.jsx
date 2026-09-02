import { useCallback, useEffect, useRef, useState } from 'react'
import { CopyIcon, DownloadIcon, ImageIcon, LockIcon, RefreshIcon, UploadIcon } from './icons'
import { extractPalette } from './color-utils'
import { downloadPalette } from './export-palette'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 15 * 1024 * 1024

function Brand() {
  const brandColors = ['#DCC9A5', '#60765E', '#92A4B7', '#5B7DA6', '#1E2A3A']
  return (
    <a className="brand" href="/" aria-label="拾色首页">
      <span className="brand-mark" aria-hidden="true">
        {brandColors.map((color) => <i key={color} style={{ background: color }} />)}
      </span>
      <span>拾色</span>
    </a>
  )
}

function UploadButton({ compact = false, onFile, inputRef }) {
  return (
    <label className={compact ? 'button button-secondary' : 'upload-button'}>
      {compact ? <RefreshIcon /> : <UploadIcon size={28} />}
      <span>{compact ? '重新选择' : '选择图片'}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => event.target.files?.[0] && onFile(event.target.files[0])}
      />
    </label>
  )
}

function EmptyUpload({ onFile, inputRef, dragActive, setDragActive }) {
  return (
    <section
      className={`empty-upload ${dragActive ? 'is-dragging' : ''}`}
      onDragEnter={(event) => { event.preventDefault(); setDragActive(true) }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragActive(false) }}
      onDrop={(event) => {
        event.preventDefault()
        setDragActive(false)
        if (event.dataTransfer.files?.[0]) onFile(event.dataTransfer.files[0])
      }}
    >
      <div className="empty-visual" aria-hidden="true">
        <span className="sample-dot dot-one" />
        <span className="sample-dot dot-two" />
        <span className="sample-dot dot-three" />
        <ImageIcon size={38} />
      </div>
      <div>
        <h2>{dragActive ? '松开即可取色' : '把图片拖到这里'}</h2>
        <p>或者从设备中选择一张照片</p>
      </div>
      <UploadButton onFile={onFile} inputRef={inputRef} />
      <p className="file-help">支持 JPG、PNG、WebP，最大 15 MB</p>
    </section>
  )
}

function Palette({ colors, copiedColor, onCopy }) {
  return (
    <div className="palette" aria-label="提取出的五种主色">
      {colors.map((color, index) => (
        <article className="swatch" key={`${color}-${index}`}>
          <div className="swatch-color" style={{ backgroundColor: color }}>
            <span className="swatch-number">0{index + 1}</span>
          </div>
          <button className="color-code" type="button" onClick={() => onCopy(color)} aria-label={`复制色号 ${color}`}>
            <span>{color}</span>
            <span className={copiedColor === color ? 'copied-label is-visible' : 'copied-label'}>
              {copiedColor === color ? '已复制' : <><CopyIcon size={17} />复制</>}
            </span>
          </button>
        </article>
      ))}
    </div>
  )
}

function ResultView({ imageUrl, imageElement, fileName, colors, onFile, inputRef, onCopy, copiedColor, onSave }) {
  return (
    <section className="result-shell">
      <div className="result-grid">
        <div className="photo-column">
          <div className="photo-frame">
            <img src={imageUrl} alt={`已导入的图片：${fileName}`} />
            {colors.slice(0, 3).map((color, index) => (
              <span
                className={`image-sample sample-${index + 1}`}
                style={{ backgroundColor: color }}
                key={color}
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="photo-meta">
            <span title={fileName}>{fileName}</span>
            <UploadButton compact onFile={onFile} inputRef={inputRef} />
          </div>
        </div>

        <div className="palette-column">
          <div className="section-heading">
            <h2>主色卡</h2>
            <span className="rule" />
          </div>
          <Palette colors={colors} copiedColor={copiedColor} onCopy={onCopy} />
          <button
            className="button button-primary"
            type="button"
            onClick={() => onSave(imageElement)}
          >
            <DownloadIcon />
            保存色卡
          </button>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [imageUrl, setImageUrl] = useState('')
  const [imageElement, setImageElement] = useState(null)
  const [fileName, setFileName] = useState('')
  const [colors, setColors] = useState([])
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [copiedColor, setCopiedColor] = useState('')
  const [saved, setSaved] = useState(false)
  const inputRef = useRef(null)
  const copiedTimer = useRef(null)
  const savedTimer = useRef(null)

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    if (savedTimer.current) clearTimeout(savedTimer.current)
  }, [imageUrl])

  const processFile = useCallback((file) => {
    setError('')
    setSaved(false)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('请选择 JPG、PNG 或 WebP 格式的图片。')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('图片超过 15 MB，请选择更小的文件。')
      return
    }

    const nextUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const maxSide = 180
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d', { willReadFrequently: true })
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const palette = extractPalette(context.getImageData(0, 0, canvas.width, canvas.height))

      setImageUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl)
        return nextUrl
      })
      setImageElement(image)
      setFileName(file.name)
      setColors(palette)
      localStorage.setItem('shise-last-palette', JSON.stringify({ colors: palette, savedAt: Date.now() }))
    }
    image.onerror = () => {
      URL.revokeObjectURL(nextUrl)
      setError('这张图片无法读取，请尝试其他文件。')
    }
    image.src = nextUrl
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  const copyColor = async (color) => {
    try {
      await navigator.clipboard.writeText(color)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = color
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }
    setCopiedColor(color)
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopiedColor(''), 1400)
  }

  const savePalette = async (image) => {
    try {
      await downloadPalette({ image, colors, fileName })
      localStorage.setItem('shise-last-palette', JSON.stringify({ colors, savedAt: Date.now() }))
      setSaved(true)
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaved(false), 2200)
    } catch {
      setError('色卡生成失败，请重试。')
    }
  }

  return (
    <div className="app">
      <header className="site-header">
        <Brand />
      </header>

      <main>
        <div className="intro">
          <h1>从一张图片，找到它的五种颜色</h1>
          <p>上传照片，自动提取主色，保存属于你的灵感色卡。</p>
        </div>

        {error && <div className="error-message" role="alert">{error}</div>}

        {imageUrl ? (
          <ResultView
            imageUrl={imageUrl}
            imageElement={imageElement}
            fileName={fileName}
            colors={colors}
            onFile={processFile}
            inputRef={inputRef}
            onCopy={copyColor}
            copiedColor={copiedColor}
            onSave={savePalette}
          />
        ) : (
          <EmptyUpload
            onFile={processFile}
            inputRef={inputRef}
            dragActive={dragActive}
            setDragActive={setDragActive}
          />
        )}
        {saved && <div className="save-toast" role="status">色卡已保存到下载文件夹</div>}
      </main>

      <footer>
        <LockIcon size={17} />
        <span>颜色计算在你的浏览器中完成，图片不会上传。</span>
      </footer>
    </div>
  )
}
