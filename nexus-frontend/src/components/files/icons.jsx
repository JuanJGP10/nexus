/** Iconos del explorador. SVG inline para que hereden `currentColor` y el tema. */

import { createElement } from 'react'
import { fileKind } from '../../utils/files'

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function FolderIcon({ className, open = false }) {
  return (
    <svg viewBox="0 0 20 16" className={className} {...STROKE}>
      <path d="M1 3a1.5 1.5 0 0 1 1.5-1.5h4.2c.5 0 .97.25 1.25.66l.85 1.24h8.7A1.5 1.5 0 0 1 19 4.9v8.6A1.5 1.5 0 0 1 17.5 15h-15A1.5 1.5 0 0 1 1 13.5V3Z" />
      {open && <path d="M1.4 13.6 3.6 7.4h15.2l-2.1 6.2" />}
    </svg>
  )
}

export function FileIcon({ className }) {
  return (
    <svg viewBox="0 0 14 18" className={className} {...STROKE}>
      <path d="M1.6 1.6h6.6l4.2 4.2v10.6H1.6V1.6Z" />
      <path d="M8.2 1.6v4.2h4.2" />
    </svg>
  )
}

export function ImageFileIcon({ className }) {
  return (
    <svg viewBox="0 0 14 18" className={className} {...STROKE}>
      <path d="M1.6 1.6h6.6l4.2 4.2v10.6H1.6V1.6Z" />
      <path d="M8.2 1.6v4.2h4.2" />
      <circle cx="5" cy="9" r="1.1" />
      <path d="M3 14.2 6 11l2 2 1.6-1.4 2 2.6" />
    </svg>
  )
}

export function VideoFileIcon({ className }) {
  return (
    <svg viewBox="0 0 14 18" className={className} {...STROKE}>
      <path d="M1.6 1.6h6.6l4.2 4.2v10.6H1.6V1.6Z" />
      <path d="M8.2 1.6v4.2h4.2" />
      <path d="M5.4 9.4v4l3.6-2-3.6-2Z" />
    </svg>
  )
}

export function AudioFileIcon({ className }) {
  return (
    <svg viewBox="0 0 14 18" className={className} {...STROKE}>
      <path d="M1.6 1.6h6.6l4.2 4.2v10.6H1.6V1.6Z" />
      <path d="M8.2 1.6v4.2h4.2" />
      <path d="M5 14V9.2l4-1v4.4" />
      <circle cx="4" cy="14" r="1" />
      <circle cx="8" cy="12.6" r="1" />
    </svg>
  )
}

export function ArchiveFileIcon({ className }) {
  return (
    <svg viewBox="0 0 14 18" className={className} {...STROKE}>
      <path d="M1.6 1.6h6.6l4.2 4.2v10.6H1.6V1.6Z" />
      <path d="M8.2 1.6v4.2h4.2" />
      <path d="M5 2v1.6M6.4 3.6v1.6M5 5.2v1.6M6.4 6.8v1.6M5 8.4V10h1.6V8.4" />
    </svg>
  )
}

export function CodeFileIcon({ className }) {
  return (
    <svg viewBox="0 0 14 18" className={className} {...STROKE}>
      <path d="M1.6 1.6h6.6l4.2 4.2v10.6H1.6V1.6Z" />
      <path d="M8.2 1.6v4.2h4.2" />
      <path d="M5.2 9.6 3.6 11.6l1.6 2M8.8 9.6l1.6 2-1.6 2" />
    </svg>
  )
}

export function DocFileIcon({ className }) {
  return (
    <svg viewBox="0 0 14 18" className={className} {...STROKE}>
      <path d="M1.6 1.6h6.6l4.2 4.2v10.6H1.6V1.6Z" />
      <path d="M8.2 1.6v4.2h4.2" />
      <path d="M4 9.6h6M4 12h6M4 14.4h3.6" />
    </svg>
  )
}

export function SheetFileIcon({ className }) {
  return (
    <svg viewBox="0 0 14 18" className={className} {...STROKE}>
      <path d="M1.6 1.6h6.6l4.2 4.2v10.6H1.6V1.6Z" />
      <path d="M8.2 1.6v4.2h4.2" />
      <path d="M3.4 9.4h7.2v5.4H3.4V9.4ZM7 9.4v5.4M3.4 12.1h7.2" />
    </svg>
  )
}

const ICON_BY_KIND = {
  image: ImageFileIcon,
  video: VideoFileIcon,
  audio: AudioFileIcon,
  pdf: DocFileIcon,
  doc: DocFileIcon,
  sheet: SheetFileIcon,
  code: CodeFileIcon,
  archive: ArchiveFileIcon,
  file: FileIcon,
}

/** Color por familia, para distinguir el tipo de un vistazo sin leer la extensión. */
const COLOR_BY_KIND = {
  image: 'text-success',
  video: 'text-accent',
  audio: 'text-accent',
  pdf: 'text-danger',
  doc: 'text-text-secondary',
  sheet: 'text-success',
  code: 'text-accent',
  archive: 'text-text-secondary',
  file: 'text-text-secondary',
}

export function iconForKind(kind) {
  return ICON_BY_KIND[kind] ?? FileIcon
}

export function colorForKind(kind) {
  return COLOR_BY_KIND[kind] ?? 'text-text-secondary'
}

/**
 * Icono de un archivo a partir de su nombre y su MIME, ya con el color de su familia.
 * Lo usan el explorador y los adjuntos de las listas, para que un .pdf se vea igual
 * en los dos sitios.
 */
export function FileKindIcon({ filename, contentType, className = '' }) {
  const kind = fileKind(filename, contentType)
  return createElement(iconForKind(kind), { className: `${className} ${colorForKind(kind)}` })
}

export function ChevronLeftIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M12.5 4.5 7 10l5.5 5.5" />
    </svg>
  )
}

export function ChevronRightIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  )
}

export function ArrowUpIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M10 16V4.5M4.8 9.6 10 4.4l5.2 5.2" />
    </svg>
  )
}

export function RefreshIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M16 6.5A7 7 0 1 0 17 10" />
      <path d="M16.5 2.6v4h-4" />
    </svg>
  )
}

export function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <circle cx="9" cy="9" r="5.4" />
      <path d="m13 13 3.6 3.6" />
    </svg>
  )
}

export function ListViewIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </svg>
  )
}

export function GridViewIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  )
}

export function UploadIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M10 13.5V3.5M6 7.2 10 3.2l4 4" />
      <path d="M3.5 12.5v3a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-3" />
    </svg>
  )
}

export function NewFolderIcon({ className }) {
  return (
    <svg viewBox="0 0 20 18" className={className} {...STROKE}>
      <path d="M1 3.4a1.5 1.5 0 0 1 1.5-1.5h4.2c.5 0 .97.25 1.25.66l.85 1.24h5.7" />
      <path d="M1 3.4v10.5A1.5 1.5 0 0 0 2.5 15.4h9" />
      <path d="M15.5 9v6M12.5 12h6" />
    </svg>
  )
}

export function FolderUploadIcon({ className }) {
  return (
    <svg viewBox="0 0 20 18" className={className} {...STROKE}>
      <path d="M1 3.4a1.5 1.5 0 0 1 1.5-1.5h4.2c.5 0 .97.25 1.25.66l.85 1.24h5.7" />
      <path d="M1 3.4v10.5A1.5 1.5 0 0 0 2.5 15.4h9" />
      <path d="M15.5 15.4V8.2M13 10.7l2.5-2.5 2.5 2.5" />
    </svg>
  )
}

export function TrashIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M3.6 5.5h12.8M8.2 5.5V3.8h3.6v1.7" />
      <path d="M5.2 5.5 6 16.2h8l.8-10.7" />
      <path d="M8.4 8.4v5M11.6 8.4v5" />
    </svg>
  )
}

export function RestoreIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M4 10a6 6 0 1 1 1.8 4.3" />
      <path d="M3.6 6v4h4" />
    </svg>
  )
}

export function DownloadIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M10 3.5v10M6 9.6l4 4 4-4" />
      <path d="M3.5 15.5h13" />
    </svg>
  )
}

export function CopyIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <rect x="7" y="7" width="9.5" height="9.5" rx="1.2" />
      <path d="M13 4.5a1.2 1.2 0 0 0-1.2-1.2H4.7A1.2 1.2 0 0 0 3.5 4.5v7.1A1.2 1.2 0 0 0 4.7 12.8" />
    </svg>
  )
}

export function CutIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <circle cx="5.6" cy="14.4" r="2.1" />
      <circle cx="14.4" cy="14.4" r="2.1" />
      <path d="M6.8 12.6 14 3.2M13.2 12.6 6 3.2" />
    </svg>
  )
}

export function PasteIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M7.5 3.5H5.6A1.6 1.6 0 0 0 4 5.1v10.3a1.6 1.6 0 0 0 1.6 1.6h8.8a1.6 1.6 0 0 0 1.6-1.6V5.1a1.6 1.6 0 0 0-1.6-1.6h-1.9" />
      <rect x="7.4" y="2" width="5.2" height="3" rx="0.8" />
    </svg>
  )
}

export function RenameIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="m3.5 13.4 8.9-8.9 3.1 3.1-8.9 8.9-3.7.6.6-3.7Z" />
      <path d="m11.4 5.5 3.1 3.1" />
    </svg>
  )
}

export function MoveIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M2.5 5.4a1.4 1.4 0 0 1 1.4-1.4h3.3l1.3 1.9h5" />
      <path d="M2.5 5.4v9.2A1.4 1.4 0 0 0 3.9 16h8" />
      <path d="M12 8.5h5.5M15 6l2.5 2.5L15 11" />
    </svg>
  )
}

export function OpenIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M10.5 3.5H4.6A1.1 1.1 0 0 0 3.5 4.6v10.8a1.1 1.1 0 0 0 1.1 1.1h10.8a1.1 1.1 0 0 0 1.1-1.1V9.5" />
      <path d="M13 3.5h3.5V7M16.2 3.8 9.6 10.4" />
    </svg>
  )
}

export function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" />
    </svg>
  )
}

export function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="m4.5 10.5 3.6 3.6 7.4-8.2" />
    </svg>
  )
}

export function HomeIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M3.4 8.6 10 3.2l6.6 5.4V16a1 1 0 0 1-1 1h-3.2v-4.6H7.6V17H4.4a1 1 0 0 1-1-1V8.6Z" />
    </svg>
  )
}

export function HelpIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <circle cx="10" cy="10" r="7" />
      <path d="M8.1 7.9a2 2 0 1 1 2.6 1.9c-.5.2-.7.6-.7 1.1v.5" />
      <path d="M10 14.2v.1" />
    </svg>
  )
}

export function MoreIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <circle cx="4.5" cy="10" r="1.2" />
      <circle cx="10" cy="10" r="1.2" />
      <circle cx="15.5" cy="10" r="1.2" />
    </svg>
  )
}

export function LinkIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...STROKE}>
      <path d="M8.4 11.6a3 3 0 0 0 4.3 0l2.4-2.4a3 3 0 0 0-4.3-4.3l-1.2 1.2" />
      <path d="M11.6 8.4a3 3 0 0 0-4.3 0l-2.4 2.4a3 3 0 0 0 4.3 4.3l1.2-1.2" />
    </svg>
  )
}
