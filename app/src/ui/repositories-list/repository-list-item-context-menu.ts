import {
  Repository,
  getRepositoryAccountIdentity,
} from '../../models/repository'
import { Account, isSameAccount } from '../../models/account'
import { IMenuItem } from '../../lib/menu-item'
import { Repositoryish } from './group-repositories'
import { writeClipboardText } from '../main-process-proxy'
import {
  RevealInFileManagerLabel,
  DefaultEditorLabel,
  DefaultShellLabel,
} from '../lib/context-menu'

interface IRepositoryListItemContextMenuConfig {
  repository: Repositoryish
  shellLabel: string | undefined
  externalEditorLabel: string | undefined
  askForConfirmationOnRemoveRepository: boolean
  /** The signed-in accounts. */
  accounts: ReadonlyArray<Account>
  onViewOnGitHub: (repository: Repositoryish) => void
  onOpenInShell: (repository: Repositoryish) => void
  onShowRepository: (repository: Repositoryish) => void
  onOpenInExternalEditor: (repository: Repositoryish) => void
  onRemoveRepository: (repository: Repositoryish) => void
  onChangeRepositoryAlias: (repository: Repository) => void
  onRemoveRepositoryAlias: (repository: Repository) => void
  onCreateWorktree?: (repository: Repository) => void
  onShowWorktrees?: (repository: Repository) => void
  onChangeRepositoryAccount: (repository: Repository, login: string) => void
  onShowRepositorySettings: (repository: Repository) => void
}

export const generateRepositoryListContextMenu = (
  config: IRepositoryListItemContextMenuConfig
) => {
  const { repository } = config
  const missing = repository instanceof Repository && repository.missing
  const github =
    repository instanceof Repository && repository.gitHubRepository != null
  const openInExternalEditor = config.externalEditorLabel
    ? `在 ${config.externalEditorLabel} 中打开`
    : DefaultEditorLabel
  const openInShell = config.shellLabel
    ? `在 ${config.shellLabel} 中打开`
    : DefaultShellLabel

  const items: ReadonlyArray<IMenuItem> = [
    ...buildAliasMenuItems(config),
    ...buildWorktreeMenuItems(config),
    ...buildAccountMenuItems(config),
    ...buildRepositorySettingsMenuItems(config),
    {
      label: '复制仓库名称',
      action: () => writeClipboardText(repository.name),
    },
    {
      label: '复制仓库路径',
      action: () => writeClipboardText(repository.path),
    },
    { type: 'separator' },
    {
      label: '在 GitHub 上查看',
      action: () => config.onViewOnGitHub(repository),
      enabled: github,
    },
    {
      label: openInShell,
      action: () => config.onOpenInShell(repository),
      enabled: !missing,
    },
    {
      label: RevealInFileManagerLabel,
      action: () => config.onShowRepository(repository),
      enabled: !missing,
    },
    {
      label: openInExternalEditor,
      action: () => config.onOpenInExternalEditor(repository),
      enabled: !missing,
    },
    { type: 'separator' },
    {
      label: config.askForConfirmationOnRemoveRepository ? '移除…' : '移除',
      action: () => config.onRemoveRepository(repository),
    },
  ]

  return items
}

const buildAliasMenuItems = (
  config: IRepositoryListItemContextMenuConfig
): ReadonlyArray<IMenuItem> => {
  const { repository } = config

  if (!(repository instanceof Repository)) {
    return []
  }

  const verb = repository.alias == null ? '创建' : '更改'
  const items: Array<IMenuItem> = [
    {
      label: `${verb}别名`,
      action: () => config.onChangeRepositoryAlias(repository),
    },
  ]

  if (repository.alias !== null) {
    items.push({
      label: '移除别名',
      action: () => config.onRemoveRepositoryAlias(repository),
    })
  }

  return items
}

const buildWorktreeMenuItems = (
  config: IRepositoryListItemContextMenuConfig
): ReadonlyArray<IMenuItem> => {
  const { repository, onCreateWorktree, onShowWorktrees } = config

  if (!(repository instanceof Repository)) {
    return []
  }

  if (onCreateWorktree === undefined && onShowWorktrees === undefined) {
    return []
  }

  const items: Array<IMenuItem> = []

  if (onShowWorktrees !== undefined) {
    items.push({
      label: '显示工作树',
      action: () => onShowWorktrees(repository),
    })
  }

  if (onCreateWorktree !== undefined) {
    items.push({
      label: '新建工作树…',
      action: () => onCreateWorktree(repository),
    })
  }

  return items
}

/**
 * Build the Account submenu used to reassign a repository to another
 * signed-in account on its endpoint.
 *
 * The submenu is omitted when there is nothing to choose between: when the
 * repository is assigned and its endpoint has only one retained account
 * identity, or when it's unassigned and no account is signed in on its
 * endpoint. An assigned account that has been signed out is still listed
 * (checked and disabled) so users can see the current association.
 */
const buildAccountMenuItems = (
  config: IRepositoryListItemContextMenuConfig
): ReadonlyArray<IMenuItem> => {
  const { repository } = config

  if (
    !(repository instanceof Repository) ||
    repository.gitHubRepository === null
  ) {
    return []
  }

  const { endpoint } = repository.gitHubRepository
  const assigned = getRepositoryAccountIdentity(repository)
  const eligible = config.accounts.filter(a => a.endpoint === endpoint)
  const signedOut =
    assigned !== null && !eligible.some(a => isSameAccount(a, assigned))
  const retainedCount = eligible.length + (signedOut ? 1 : 0)

  if (assigned === null ? eligible.length === 0 : retainedCount <= 1) {
    return []
  }

  const submenu: Array<IMenuItem> = []

  if (signedOut) {
    submenu.push({
      label: `@${assigned.login} (Signed out)`,
      type: 'checkbox',
      checked: true,
      enabled: false,
    })
  }

  for (const account of eligible) {
    const checked = isSameAccount(account, assigned)
    submenu.push({
      label: `@${account.login}`,
      type: 'checkbox',
      checked,
      action: checked
        ? undefined
        : () => config.onChangeRepositoryAccount(repository, account.login),
    })
  }

  return [{ label: '账号', submenu }]
}

const buildRepositorySettingsMenuItems = (
  config: IRepositoryListItemContextMenuConfig
): ReadonlyArray<IMenuItem> => {
  const { repository } = config

  if (!(repository instanceof Repository) || repository.missing) {
    return []
  }

  return [
    {
      label: '仓库设置…',
      action: () => config.onShowRepositorySettings(repository),
    },
  ]
}
