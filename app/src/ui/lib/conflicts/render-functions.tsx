import * as React from 'react'
import { Octicon } from '../../octicons'
import * as octicons from '../../octicons/octicons.generated'
import { LinkButton } from '../link-button'

export function renderUnmergedFilesSummary(conflictedFilesCount: number) {
  // localization, it burns :vampire:
  const message =
    conflictedFilesCount === 1
      ? `1 个冲突文件`
      : `${conflictedFilesCount} 个冲突文件`
  return <h2 className="summary">{message}</h2>
}

export function renderAllResolved() {
  return (
    <div className="all-conflicts-resolved">
      <div className="green-circle">
        <Octicon symbol={octicons.check} />
      </div>
      <div className="message">所有冲突均已解决</div>
    </div>
  )
}

export function renderShellLink(openThisRepositoryInShell: () => void) {
  return (
    <div>
      <LinkButton onClick={openThisRepositoryInShell}>
        在命令行中打开，
      </LinkButton>{' '}
      此仓库，或关闭以手动解决。
    </div>
  )
}
