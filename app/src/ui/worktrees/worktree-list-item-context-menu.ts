import * as Path from 'path'

import { IMenuItem } from '../../lib/menu-item'
import { writeClipboardText } from '../main-process-proxy'
import { isRepositoryAffectedByAssistedCommit } from '../../lib/git/repository-operation'

interface IWorktreeContextMenuConfig {
  readonly path: string
  readonly isMainWorktree: boolean
  readonly isLocked: boolean
  readonly onRenameWorktree?: (path: string) => void
  readonly onRemoveWorktree?: (path: string) => void
}

export function generateWorktreeContextMenuItems(
  config: IWorktreeContextMenuConfig
): ReadonlyArray<IMenuItem> {
  const { path, isMainWorktree, isLocked, onRenameWorktree, onRemoveWorktree } =
    config
  const name = Path.basename(path)
  const canMutate =
    !isMainWorktree && !isLocked && !isRepositoryAffectedByAssistedCommit(path)
  const items = new Array<IMenuItem>()

  if (onRenameWorktree !== undefined) {
    items.push({
      label: '重命名…',
      action: () => onRenameWorktree(path),
      enabled: canMutate,
    })
  }

  items.push({
    label: '复制工作树名称',
    action: () => writeClipboardText(name),
  })

  items.push({
    label: '复制工作树路径',
    action: () => writeClipboardText(path),
  })

  items.push({ type: 'separator' })

  if (onRemoveWorktree !== undefined) {
    items.push({
      label: '删除…',
      action: () => onRemoveWorktree(path),
      enabled: canMutate,
    })
  }

  return items
}
