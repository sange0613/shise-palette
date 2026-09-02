const Icon = ({ children, size = 22, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
)

export const UploadIcon = (props) => (
  <Icon {...props}>
    <path d="M12 16V3" />
    <path d="m7 8 5-5 5 5" />
    <path d="M5 13H3.8A1.8 1.8 0 0 0 2 14.8v4.4A1.8 1.8 0 0 0 3.8 21h16.4a1.8 1.8 0 0 0 1.8-1.8v-4.4a1.8 1.8 0 0 0-1.8-1.8H19" />
  </Icon>
)

export const CopyIcon = (props) => (
  <Icon {...props}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Icon>
)

export const DownloadIcon = (props) => (
  <Icon {...props}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Icon>
)

export const RefreshIcon = (props) => (
  <Icon {...props}>
    <path d="M20 6v5h-5" />
    <path d="M18.5 15a7.5 7.5 0 1 1-.7-7.7L20 11" />
  </Icon>
)

export const LockIcon = (props) => (
  <Icon {...props}>
    <rect x="5" y="10" width="14" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Icon>
)

export const ImageIcon = (props) => (
  <Icon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </Icon>
)
