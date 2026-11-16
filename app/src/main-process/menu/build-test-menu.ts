import { MenuItemConstructorOptions } from 'electron'
import { enableTestMenuItems } from '../../lib/feature-flag'
import { emit, separator } from './build-default-menu'

export function buildTestMenu() {
  if (!enableTestMenuItems()) {
    return []
  }

  const testMenuItems: MenuItemConstructorOptions[] = []

  if (__WIN32__) {
    testMenuItems.push(separator, {
      label: '命令行工具',
      submenu: [
        {
          label: '安装',
          click: emit('install-windows-cli'),
        },
        {
          label: '卸载',
          click: emit('uninstall-windows-cli'),
        },
      ],
    })
  }

  const errorDialogsSubmenu: MenuItemConstructorOptions[] = [
    {
      label: '确认提交冲突文件',
      click: emit('test-confirm-committing-conflicted-files'),
    },
    {
      label: '丢弃的更改将无法恢复',
      click: emit('test-discarded-changes-will-be-unrecoverable'),
    },
    {
      label: '您确定要 fork 此仓库吗？',
      click: emit('test-do-you-want-fork-this-repository'),
    },
    {
      label: '远程有更新的提交',
      click: emit('test-newer-commits-on-remote'),
    },
    {
      label: '文件过大',
      click: emit('test-files-too-large'),
    },
    {
      label: '通用 Git 身份验证',
      click: emit('test-generic-git-authentication'),
    },
    {
      label: '账号令牌已失效',
      click: emit('test-invalidated-account-token'),
    },
  ]

  if (__DARWIN__) {
    errorDialogsSubmenu.push({
      label: '移动到应用程序文件夹',
      click: emit('test-move-to-application-folder'),
    })
  }

  errorDialogsSubmenu.push(
    {
      label: '推送被拒绝',
      click: emit('test-push-rejected'),
    },
    {
      label: '需要重新授权',
      click: emit('test-re-authorization-required'),
    },
    {
      label: '无法找到 Git',
      click: emit('test-unable-to-locate-git'),
    },
    {
      label: '无法打开外部编辑器',
      click: emit('test-no-external-editor'),
    },
    {
      label: '无法打开终端',
      click: emit('test-unable-to-open-shell'),
    },
    {
      label: '服务器不受信任',
      click: emit('test-untrusted-server'),
    },
    {
      label: '要更新现有的 Git LFS 过滤器吗？',
      click: emit('test-update-existing-git-lfs-filters'),
    },
    {
      label: '上游已存在',
      click: emit('test-upstream-already-exists'),
    }
  )

  testMenuItems.push(
    separator,
    {
      label: '使主进程崩溃…',
      click() {
        throw new Error('Boomtown!')
      },
    },
    {
      label: '使渲染进程崩溃…',
      click: emit('boomtown'),
    },
    {
      label: '清理分支',
      click: emit('test-prune-branches'),
    },
    {
      label: '显示通知',
      click: emit('test-notification'),
    },
    {
      label: '分发 CLI 操作',
      click: emit('test-cli-action'),
    },
    {
      label: '发送统计',
      click: emit('test-send-stats'),
    },
    {
      label: '显示弹窗',
      submenu: [
        {
          label: '发行说明',
          click: emit('test-release-notes-popup'),
        },
        {
          label: '感谢页',
          click: emit('test-thank-you-popup'),
        },
        {
          label: '显示应用错误',
          click: emit('test-app-error'),
        },
        {
          label: 'Octicons',
          click: emit('test-icons'),
        },
        {
          label: '关于对话框（测试模式）',
          click: emit('test-about-dialog'),
        },
        {
          label: 'Copilot 快照卡片',
          click: emit('test-copilot-snapshot-card'),
        },
        {
          label: '令牌过期',
          click: emit('test-token-expiration'),
        },
      ],
    },
    {
      label: '显示横幅',
      submenu: [
        {
          label: '更新横幅',
          click: emit('test-update-banner'),
        },
        {
          label: '更新横幅（优先）',
          click: emit('test-prioritized-update-banner'),
        },
        {
          label: `展示更新横幅`,
          click: emit('test-showcase-update-banner'),
        },
        {
          label: `${__DARWIN__ ? 'Apple silicon' : 'Arm64'} 横幅`,
          click: emit('test-arm64-banner'),
        },
        {
          label: '感谢页',
          click: emit('test-thank-you-banner'),
        },
        {
          label: '重新排序成功',
          click: emit('test-reorder-banner'),
        },
        {
          label: '重新排序已撤销',
          click: emit('test-undone-banner'),
        },
        {
          label: '拣选冲突',
          click: emit('test-cherry-pick-conflicts-banner'),
        },
        {
          label: '合并成功',
          click: emit('test-merge-successful-banner'),
        },
        {
          label: '操作系统版本不再受支持',
          click: emit('test-os-version-no-longer-supported'),
        },
      ],
    },
    {
      label: '显示错误对话框',
      submenu: errorDialogsSubmenu,
    }
  )

  return testMenuItems
}
