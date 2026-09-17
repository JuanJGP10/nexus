import { FileExplorer } from '../components/files/FileExplorer'

/**
 * Explorador a pantalla completa.
 *
 * Centrado y con ancho tope, como el horario: a pantalla completa las columnas
 * de nombre, tamaño y fecha quedaban separadas por medio metro de vacío. En
 * móvil ocupa todo porque no sobra ancho.
 */
export function FilesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <FileExplorer variant="page" />
    </div>
  )
}
