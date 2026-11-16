import * as React from 'react'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { PathText } from '../lib/path-text'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { UnknownAuthor } from '../../models/author'

interface IUnknownAuthorsProps {
  readonly authors: ReadonlyArray<UnknownAuthor>
  readonly onCommit: () => void
  readonly onDismissed: () => void
}

/**
 * Don't list more than this number of authors.
 */
const MaxAuthorsToList = 10

/** A component to confirm commit when unknown co-authors were added. */
export class UnknownAuthors extends React.Component<IUnknownAuthorsProps> {
  public constructor(props: IUnknownAuthorsProps) {
    super(props)
  }

  public render() {
    return (
      <Dialog
        id="unknown-authors"
        title={__DARWIN__ ? '未知的共同作者' : '未知的共同作者'}
        onDismissed={this.props.onDismissed}
        onSubmit={this.commit}
        type="warning"
      >
        <DialogContent>{this.renderAuthorList()}</DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={__DARWIN__ ? '仍然提交' : '仍然提交'}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderAuthorList() {
    if (this.props.authors.length > MaxAuthorsToList) {
      return (
        <p>
          未找到 {this.props.authors.length} 位用户，因此不会将其添加为此提交的
          共同作者。确定要提交吗？
        </p>
      )
    } else {
      return (
        <div>
          <p>
            未找到这些用户，因此不会将其添加为此提交的
            共同作者。确定要提交吗？
          </p>
          <div className="author-list">
            <ul>
              {this.props.authors.map(a => (
                <li key={a.username}>
                  <PathText path={a.username} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    }
  }

  private commit = async () => {
    this.props.onCommit()
    this.props.onDismissed()
  }
}
