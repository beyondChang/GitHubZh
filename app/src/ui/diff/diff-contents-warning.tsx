import React from 'react'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { LinkButton } from '../lib/link-button'
import { ITextDiff, LineEndingsChange } from '../../models/diff'

enum DiffContentsWarningType {
  UnicodeBidiCharacters,
  LineEndingsChange,
}

type DiffContentsWarningItem =
  | {
      readonly type: DiffContentsWarningType.UnicodeBidiCharacters
    }
  | {
      readonly type: DiffContentsWarningType.LineEndingsChange
      readonly lineEndingsChange: LineEndingsChange
    }

interface IDiffContentsWarningProps {
  readonly diff: ITextDiff
}

export class DiffContentsWarning extends React.Component<IDiffContentsWarningProps> {
  public render() {
    const items = this.getTextDiffWarningItems()

    if (items.length === 0) {
      return null
    }

    return (
      <div className="diff-contents-warning-container">
        {items.map((item, i) => (
          <div className="diff-contents-warning" key={i}>
            <Octicon symbol={octicons.alert} />
            {this.getWarningMessageForItem(item)}
          </div>
        ))}
      </div>
    )
  }

  private getTextDiffWarningItems(): ReadonlyArray<DiffContentsWarningItem> {
    const items = new Array<DiffContentsWarningItem>()
    const { diff } = this.props

    if (diff.hasHiddenBidiChars) {
      items.push({
        type: DiffContentsWarningType.UnicodeBidiCharacters,
      })
    }

    if (diff.lineEndingsChange) {
      items.push({
        type: DiffContentsWarningType.LineEndingsChange,
        lineEndingsChange: diff.lineEndingsChange,
      })
    }

    return items
  }

  private getWarningMessageForItem(item: DiffContentsWarningItem) {
    switch (item.type) {
      case DiffContentsWarningType.UnicodeBidiCharacters:
        return (
          <>
            此差异包含双向 Unicode 文本，其解释或编译方式可能与下方显示的内容
            不同。要进行审阅，请在可显示隐藏 Unicode 字符的编辑器中打开该文件。
            {' '}
            <LinkButton uri="https://github.co/hiddenchars">
              详细了解双向 Unicode 字符
            </LinkButton>
          </>
        )

      case DiffContentsWarningType.LineEndingsChange:
        const { lineEndingsChange } = item
        return (
          <>
            此文件使用“{lineEndingsChange.from}”换行符，但
            <LinkButton uri="https://docs.github.com/get-started/git-basics/configuring-git-to-handle-line-endings">
              Git 已配置为自动转换它们
            </LinkButton>{' '}
            在下次检出该文件时会转换为“{lineEndingsChange.to}”。
          </>
        )
    }
  }
}
