import { Panel } from '../components/Panel'
import { ListGrid } from '../components/ListGrid'
import { useDayLists } from '../lib/useDayLists'

export function ListsPage() {
  const { lists, isLoading, error, addList, renameList, removeList, addItem, toggleItem, editItemText, removeItem } =
    useDayLists(undefined)

  return (
    <div>
      <Panel title="Listas" bodyClassName="p-4">
        {error && (
          <p className="mb-4 border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="font-mono text-xs text-text-secondary">Cargando…</p>
        ) : (
          <ListGrid
            lists={lists}
            onAddList={addList}
            onRenameList={renameList}
            onAddItem={addItem}
            onToggleItem={toggleItem}
            onEditItemText={editItemText}
            onRemoveItem={removeItem}
            onRemoveList={removeList}
          />
        )}
      </Panel>
    </div>
  )
}
