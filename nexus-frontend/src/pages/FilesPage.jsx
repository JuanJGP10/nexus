import { FileExplorer } from '../components/files/FileExplorer'

/**
 * Explorador a pantalla completa.
 *
 * El widget del panel sigue existiendo para consultas rápidas, pero organizar
 * archivos de verdad (seleccionar varios, arrastrar entre carpetas, ver
 * tamaños y fechas) necesita todo el ancho, y en móvil aún más.
 */
export function FilesPage() {
  return (
    <div className="h-full min-h-[320px]">
      <FileExplorer variant="page" />
    </div>
  )
}
