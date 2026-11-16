import * as React from 'react'
import { Ref } from './ref'
import { LinkButton } from './link-button'
import { unlink } from 'fs/promises'

interface IConfigLockFileExistsProps {
  /**
   * The path to the lock file that's preventing a configuration
   * file update.
   */
  readonly lockFilePath: string

  /**
   * Called when the lock file has been deleted and the configuration
   * update can be retried
   */
  readonly onLockFileDeleted: () => void

  /**
   * Called if the lock file couldn't be deleted
   */
  readonly onError: (e: Error) => void
}

export class ConfigLockFileExists extends React.Component<IConfigLockFileExistsProps> {
  private onDeleteLockFile = async () => {
    try {
      await unlink(this.props.lockFilePath)
    } catch (e) {
      // We don't care about failure to unlink due to the
      // lock file not existing any more
      if (e.code !== 'ENOENT') {
        this.props.onError(e)
        return
      }
    }

    this.props.onLockFileDeleted()
  }
  public render() {
    return (
      <div className="config-lock-file-exists-component">
        <p>
          更新 Git 配置文件失败。以下位置已存在锁文件：
          <Ref>{this.props.lockFilePath}</Ref>。
        </p>
        <p>
          如果另一个工具正在修改 Git 配置，或者之前某个 Git 进程
          异常终止而未清理锁文件，就可能出现这种情况。您是否要{' '}
          <LinkButton onClick={this.onDeleteLockFile}>
            删除该锁文件
          </LinkButton>{' '}
          并重试？
        </p>
      </div>
    )
  }
}
