import { Menu, shell, app, BrowserWindow } from 'electron'
import { ensureItemIds } from './ensure-item-ids'
import { MenuEvent } from './menu-event'
import { truncateWithEllipsis } from '../../lib/truncate-with-ellipsis'
import { getLogDirectoryPath } from '../../lib/logging/get-log-path'
import { UNSAFE_openDirectory } from '../shell'
import {
  enableCopilotAppHandoff,
  enableWorktreeSupport,
} from '../../lib/feature-flag'
import { MenuLabelsEvent } from '../../models/menu-labels'
import * as ipcWebContents from '../ipc-webcontents'
import { mkdir } from 'fs/promises'
import { buildTestMenu } from './build-test-menu'

const createPullRequestLabel = '创建拉取请求'
const showPullRequestLabel = '在 GitHub 上查看拉取请求'
const defaultBranchNameValue = '默认分支'
const confirmRepositoryRemovalLabel = '移除…'
const repositoryRemovalLabel = '移除'
const confirmStashAllChangesLabel = '暂存所有更改…'
const stashAllChangesLabel = '暂存所有更改'

enum ZoomDirection {
  Reset,
  In,
  Out,
}

export const separator: Electron.MenuItemConstructorOptions = {
  type: 'separator',
}

export function buildDefaultMenu(params: MenuLabelsEvent): Electron.Menu {
  return Menu.buildFromTemplate(buildDefaultMenuTemplate(params))
}

export function buildDefaultMenuTemplate({
  selectedExternalEditor,
  selectedShell,
  askForConfirmationOnForcePush,
  askForConfirmationOnRepositoryRemoval,
  hasCurrentPullRequest = false,
  contributionTargetDefaultBranch = defaultBranchNameValue,
  isForcePushForCurrentRepository = false,
  isStashedChangesVisible = false,
  askForConfirmationWhenStashingAllChanges = true,
  isChangesFilterVisible = true,
}: MenuLabelsEvent): Electron.MenuItemConstructorOptions[] {
  contributionTargetDefaultBranch = truncateWithEllipsis(
    contributionTargetDefaultBranch,
    25
  )

  const removeRepoLabel = askForConfirmationOnRepositoryRemoval
    ? confirmRepositoryRemovalLabel
    : repositoryRemovalLabel

  const pullRequestLabel = hasCurrentPullRequest
    ? showPullRequestLabel
    : createPullRequestLabel

  const template = new Array<Electron.MenuItemConstructorOptions>()

  if (__DARWIN__) {
    template.push({
      label: 'GitHub Desktop',
      submenu: [
        {
          label: '关于 GitHub Desktop',
          click: emit('show-about'),
          id: 'about',
        },
        separator,
        {
          label: '设置…',
          id: 'preferences',
          accelerator: 'CmdOrCtrl+,',
          click: emit('show-preferences'),
        },
        separator,
        {
          label: '安装命令行工具…',
          id: 'install-cli',
          click: emit('install-darwin-cli'),
        },
        separator,
        {
          role: 'services',
          submenu: [],
        },
        separator,
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        separator,
        { role: 'quit' },
      ],
    })
  }

  const fileMenu: Electron.MenuItemConstructorOptions = {
    label: '文件',
    submenu: [
      {
        label: '新建仓库…',
        id: 'new-repository',
        click: emit('create-repository'),
        accelerator: 'CmdOrCtrl+N',
      },
      separator,
      {
        label: '添加本地仓库…',
        id: 'add-local-repository',
        accelerator: 'CmdOrCtrl+O',
        click: emit('add-local-repository'),
      },
      {
        label: '克隆仓库…',
        accelerator: 'CmdOrCtrl+Shift+O',
        click: emit('clone-repository'),
      },
    ],
  }

  if (!__DARWIN__) {
    const fileItems = fileMenu.submenu as Electron.MenuItemConstructorOptions[]
    const exitAccelerator = __WIN32__ ? 'Alt+F4' : 'CmdOrCtrl+Q'

    fileItems.push(
      separator,
      {
        label: '选项…',
        id: 'preferences',
        accelerator: 'CmdOrCtrl+,',
        click: emit('show-preferences'),
      },
      separator,
      {
        role: 'quit',
        label: '退出',
        accelerator: exitAccelerator,
      }
    )
  }

  template.push(fileMenu)

  template.push({
    label: '编辑',
    submenu: [
      { role: 'undo', label: '撤销' },
      { role: 'redo', label: '重做' },
      separator,
      { role: 'cut', label: '剪切' },
      { role: 'copy', label: '复制' },
      { role: 'paste', label: '粘贴' },
      {
        label: '全选',
        accelerator: 'CmdOrCtrl+A',
        click: emit('select-all'),
      },
      separator,
      {
        id: 'find',
        label: '查找',
        accelerator: 'CmdOrCtrl+F',
        click: emit('find-text'),
      },
    ],
  })

  template.push({
    label: '视图',
    submenu: [
      {
        label: '更改',
        id: 'show-changes',
        accelerator: 'CmdOrCtrl+1',
        click: emit('show-changes'),
      },
      {
        label: '历史',
        id: 'show-history',
        accelerator: 'CmdOrCtrl+2',
        click: emit('show-history'),
      },
      {
        label: '仓库列表',
        id: 'show-repository-list',
        accelerator: 'CmdOrCtrl+T',
        click: emit('choose-repository'),
      },
      {
        label: '分支列表',
        id: 'show-branches-list',
        accelerator: 'CmdOrCtrl+B',
        click: emit('show-branches'),
      },
      {
        label: '工作树列表',
        id: 'show-worktrees-list',
        accelerator: 'CmdOrCtrl+Alt+W',
        click: emit('show-worktrees'),
        visible: enableWorktreeSupport(),
      },
      separator,
      {
        label: '转到摘要',
        id: 'go-to-commit-message',
        accelerator: 'CmdOrCtrl+G',
        click: emit('go-to-commit-message'),
      },
      {
        label: getStashedChangesLabel(isStashedChangesVisible),
        id: 'toggle-stashed-changes',
        accelerator: 'Ctrl+H',
        click: isStashedChangesVisible
          ? emit('hide-stashed-changes')
          : emit('show-stashed-changes'),
      },
      {
        label: `${isChangesFilterVisible ? '隐藏' : '显示'}更改筛选`,
        id: 'toggle-changes-filter',
        accelerator: 'CmdOrCtrl+L',
        click: emit('toggle-changes-filter'),
      },
      {
        label: '切换全屏',
        role: 'togglefullscreen',
      },
      separator,
      {
        label: '重置缩放',
        accelerator: 'CmdOrCtrl+0',
        click: zoom(ZoomDirection.Reset),
      },
      {
        label: '放大',
        accelerator: 'CmdOrCtrl+=',
        click: zoom(ZoomDirection.In),
      },
      {
        label: '缩小',
        accelerator: 'CmdOrCtrl+-',
        click: zoom(ZoomDirection.Out),
      },
      {
        label: '展开当前可调整区域',
        id: 'increase-active-resizable-width',
        accelerator: 'CmdOrCtrl+9',
        click: emit('increase-active-resizable-width'),
      },
      {
        label: '收缩当前可调整区域',
        id: 'decrease-active-resizable-width',
        accelerator: 'CmdOrCtrl+8',
        click: emit('decrease-active-resizable-width'),
      },
      separator,
      {
        label: '重新加载',
        id: 'reload-window',
        // Ctrl+Alt is interpreted as AltGr on international keyboards and this
        // can clash with other shortcuts. We should always use Ctrl+Shift for
        // chorded shortcuts, but this menu item is not a user-facing feature
        // so we are going to keep this one around.
        accelerator: 'CmdOrCtrl+Alt+R',
        click(item: any, focusedWindow: Electron.BaseWindow | undefined) {
          if (focusedWindow instanceof BrowserWindow) {
            focusedWindow.reload()
          }
        },
        visible: __RELEASE_CHANNEL__ === 'development',
      },
      {
        id: 'show-devtools',
        label: '切换开发者工具',
        accelerator: (() => {
          return __DARWIN__ ? 'Alt+Command+I' : 'Ctrl+Shift+I'
        })(),
        click(item: any, focusedWindow: Electron.BaseWindow | undefined) {
          if (focusedWindow instanceof BrowserWindow) {
            focusedWindow.webContents.toggleDevTools()
          }
        },
      },
    ],
  })

  const pushLabel = getPushLabel(
    isForcePushForCurrentRepository,
    askForConfirmationOnForcePush
  )

  const pushEventType = isForcePushForCurrentRepository ? 'force-push' : 'push'

  template.push({
    label: '仓库',
    id: 'repository',
    submenu: [
      {
        id: 'push',
        label: pushLabel,
        accelerator: 'CmdOrCtrl+P',
        click: emit(pushEventType),
      },
      {
        id: 'pull',
        label: '拉取',
        accelerator: 'CmdOrCtrl+Shift+P',
        click: emit('pull'),
      },
      {
        id: 'fetch',
        label: '获取',
        accelerator: 'CmdOrCtrl+Shift+T',
        click: emit('fetch'),
      },
      {
        label: removeRepoLabel,
        id: 'remove-repository',
        accelerator: 'CmdOrCtrl+Backspace',
        click: emit('remove-repository'),
      },
      separator,
      {
        id: 'view-repository-on-github',
        label: '在 GitHub 上查看',
        accelerator: 'CmdOrCtrl+Shift+G',
        click: emit('view-repository-on-github'),
      },
      {
        label: `在 ${selectedShell ?? '终端'}中打开`,
        id: 'open-in-shell',
        accelerator: 'Ctrl+`',
        click: emit('open-in-shell'),
      },
      {
        label: __DARWIN__
          ? '在访达中显示'
          : __WIN32__
          ? '在资源管理器中显示'
          : '在文件管理器中显示',
        id: 'open-working-directory',
        accelerator: 'CmdOrCtrl+Shift+F',
        click: emit('open-working-directory'),
      },
      {
        label: `在 ${selectedExternalEditor ?? '外部编辑器'}中打开`,
        id: 'open-external-editor',
        accelerator: 'CmdOrCtrl+Shift+A',
        click: emit('open-external-editor'),
      },
      ...(enableCopilotAppHandoff()
        ? [
            {
              label: '在 GitHub Copilot 中打开',
              id: 'open-in-copilot-app',
              accelerator: 'CmdOrCtrl+Shift+J',
              click: emit('open-in-copilot-app'),
            },
          ]
        : []),
      {
        label: '打开方式…',
        id: 'open-with-external-editor',
        accelerator: 'CmdOrCtrl+Shift+Alt+A',
        click: emit('open-with-external-editor'),
      },
      separator,
      {
        id: 'create-issue-in-repository-on-github',
        label: '在 GitHub 上创建议题',
        accelerator: 'CmdOrCtrl+I',
        click: emit('create-issue-in-repository-on-github'),
      },
      separator,
      {
        id: 'create-worktree',
        label: '新建工作树…',
        click: emit('create-worktree'),
        accelerator: 'CmdOrCtrl+Shift+W',
        visible: enableWorktreeSupport(),
      },
      ...(enableWorktreeSupport() ? [separator] : []),
      {
        label: '仓库设置…',
        id: 'show-repository-settings',
        click: emit('show-repository-settings'),
      },
    ],
  })

  const branchSubmenu = [
    {
      label: '新建分支…',
      id: 'create-branch',
      accelerator: 'CmdOrCtrl+Shift+N',
      click: emit('create-branch'),
    },
    {
      label: '重命名…',
      id: 'rename-branch',
      accelerator: 'CmdOrCtrl+Shift+R',
      click: emit('rename-branch'),
    },
    {
      label: '删除…',
      id: 'delete-branch',
      accelerator: 'CmdOrCtrl+Shift+D',
      click: emit('delete-branch'),
    },
    separator,
    {
      label: '放弃所有更改…',
      id: 'discard-all-changes',
      accelerator: 'CmdOrCtrl+Shift+Backspace',
      click: emit('discard-all-changes'),
    },
    {
      label: askForConfirmationWhenStashingAllChanges
        ? confirmStashAllChangesLabel
        : stashAllChangesLabel,
      id: 'stash-all-changes',
      accelerator: 'CmdOrCtrl+Shift+S',
      click: emit('stash-all-changes'),
    },
    separator,
    {
      label: `从 ${contributionTargetDefaultBranch} 更新`,
      id: 'update-branch-with-contribution-target-branch',
      accelerator: 'CmdOrCtrl+Shift+U',
      click: emit('update-branch-with-contribution-target-branch'),
    },
    {
      label: '与分支比较',
      id: 'compare-to-branch',
      accelerator: 'CmdOrCtrl+Shift+B',
      click: emit('compare-to-branch'),
    },
    {
      label: '合并到当前分支…',
      id: 'merge-branch',
      accelerator: 'CmdOrCtrl+Shift+M',
      click: emit('merge-branch'),
    },
    {
      label: '压缩并合并到当前分支…',
      id: 'squash-and-merge-branch',
      accelerator: 'CmdOrCtrl+Shift+H',
      click: emit('squash-and-merge-branch'),
    },
    {
      label: '变基当前分支…',
      id: 'rebase-branch',
      accelerator: 'CmdOrCtrl+Shift+E',
      click: emit('rebase-branch'),
    },
    separator,
    {
      label: '在 GitHub 上比较',
      id: 'compare-on-github',
      accelerator: 'CmdOrCtrl+Shift+C',
      click: emit('compare-on-github'),
    },
    {
      label: '在 GitHub 上查看分支',
      id: 'branch-on-github',
      accelerator: 'CmdOrCtrl+Alt+B',
      click: emit('branch-on-github'),
    },
  ]

  branchSubmenu.push({
    label: '预览拉取请求',
    id: 'preview-pull-request',
    accelerator: 'CmdOrCtrl+Alt+P',
    click: emit('preview-pull-request'),
  })

  branchSubmenu.push({
    label: pullRequestLabel,
    id: 'create-pull-request',
    accelerator: 'CmdOrCtrl+R',
    click: emit('open-pull-request'),
  })

  template.push({
    label: '分支',
    id: 'branch',
    submenu: branchSubmenu,
  })

  if (__DARWIN__) {
    template.push({
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
        separator,
        { role: 'front' },
      ],
    })
  }

  const submitIssueItem: Electron.MenuItemConstructorOptions = {
    label: '报告问题…',
    click() {
      shell
        .openExternal('https://github.com/desktop/desktop/issues/new/choose')
        .catch(err => log.error('Failed opening issue creation page', err))
    },
  }

  const contactSupportItem: Electron.MenuItemConstructorOptions = {
    label: '联系 GitHub 支持…',
    click() {
      shell
        .openExternal(
          `https://github.com/contact?from_desktop_app=1&app_version=${app.getVersion()}`
        )
        .catch(err => log.error('Failed opening contact support page', err))
    },
  }

  const showUserGuides: Electron.MenuItemConstructorOptions = {
    label: '查看用户指南',
    click() {
      shell
        .openExternal('https://docs.github.com/en/desktop')
        .catch(err => log.error('Failed opening user guides page', err))
    },
  }

  const showKeyboardShortcuts: Electron.MenuItemConstructorOptions = {
    label: '查看键盘快捷键',
    click() {
      shell
        .openExternal(
          'https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/overview/keyboard-shortcuts'
        )
        .catch(err => log.error('Failed opening keyboard shortcuts page', err))
    },
  }

  const showLogsLabel = __DARWIN__
    ? '在访达中显示日志'
    : __WIN32__
    ? '在资源管理器中显示日志'
    : '在文件管理器中显示日志',

  const showLogsItem: Electron.MenuItemConstructorOptions = {
    label: showLogsLabel,
    click() {
      const logPath = getLogDirectoryPath()
      mkdir(logPath, { recursive: true })
        .then(() => UNSAFE_openDirectory(logPath))
        .catch(err => log.error('Failed opening logs directory', err))
    },
  }

  const helpItems = [
    submitIssueItem,
    contactSupportItem,
    showUserGuides,
    showKeyboardShortcuts,
    showLogsItem,
  ]

  helpItems.push(...buildTestMenu())

  if (__DARWIN__) {
    template.push({
      role: 'help',
      submenu: helpItems,
    })
  } else {
    template.push({
      label: '帮助',
      submenu: [
        ...helpItems,
        separator,
        {
          label: '关于 GitHub Desktop',
          click: emit('show-about'),
          id: 'about',
        },
      ],
    })
  }

  ensureItemIds(template)

  return template
}

function getPushLabel(
  isForcePushForCurrentRepository: boolean,
  askForConfirmationOnForcePush: boolean
): string {
  if (!isForcePushForCurrentRepository) {
    return '推送'
  }

  if (askForConfirmationOnForcePush) {
    return '强制推送…'
  }

  return '强制推送'
}

function getStashedChangesLabel(isStashedChangesVisible: boolean): string {
  return isStashedChangesVisible ? '隐藏已暂存的更改' : '显示已暂存的更改'
}

type ClickHandler = (
  menuItem: Electron.MenuItem,
  browserWindow: Electron.BaseWindow | undefined,
  event: Electron.KeyboardEvent
) => void

/**
 * Utility function returning a Click event handler which, when invoked, emits
 * the provided menu event over IPC.
 */
export function emit(name: MenuEvent): ClickHandler {
  return (_, focusedWindow) => {
    // focusedWindow can be null if the menu item was clicked without the window
    // being in focus. A simple way to reproduce this is to click on a menu item
    // while in DevTools. Since Desktop only supports one window at a time we
    // can be fairly certain that the first BrowserWindow we find is the one we
    // want.
    const window =
      focusedWindow instanceof BrowserWindow
        ? focusedWindow
        : BrowserWindow.getAllWindows()[0]
    if (window !== undefined) {
      if (!window.isVisible()) {
        window.show()
      }
      ipcWebContents.send(window.webContents, 'menu-event', name)
    }
  }
}

/** The zoom steps that we support, these factors must sorted */
const ZoomInFactors = [0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2]
const ZoomOutFactors = ZoomInFactors.slice().reverse()

/**
 * Returns the element in the array that's closest to the value parameter. Note
 * that this function will throw if passed an empty array.
 */
function findClosestValue(arr: Array<number>, value: number) {
  return arr.reduce((previous, current) => {
    return Math.abs(current - value) < Math.abs(previous - value)
      ? current
      : previous
  })
}

/**
 * Figure out the next zoom level for the given direction and alert the renderer
 * about a change in zoom factor if necessary.
 */
function zoom(direction: ZoomDirection): ClickHandler {
  return (menuItem, window) => {
    if (!(window instanceof BrowserWindow)) {
      return
    }

    const { webContents } = window

    if (direction === ZoomDirection.Reset) {
      webContents.zoomFactor = 1
      ipcWebContents.send(webContents, 'zoom-factor-changed', 1)
    } else {
      const rawZoom = webContents.zoomFactor
      const zoomFactors =
        direction === ZoomDirection.In ? ZoomInFactors : ZoomOutFactors

      // So the values that we get from zoomFactor property are floating point
      // precision numbers from chromium, that don't always round nicely, so
      // we'll have to do a little trick to figure out which of our supported
      // zoom factors the value is referring to.
      const currentZoom = findClosestValue(zoomFactors, rawZoom)

      const nextZoomLevel = zoomFactors.find(f =>
        direction === ZoomDirection.In ? f > currentZoom : f < currentZoom
      )

      // If we couldn't find a zoom level (likely due to manual manipulation
      // of the zoom factor in devtools) we'll just snap to the closest valid
      // factor we've got.
      const newZoom = nextZoomLevel === undefined ? currentZoom : nextZoomLevel

      webContents.zoomFactor = newZoom
      ipcWebContents.send(webContents, 'zoom-factor-changed', newZoom)
    }
  }
}
