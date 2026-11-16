import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { Ref } from '../lib/ref'
import { RepositoryWithGitHubRepository } from '../../models/repository'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { SignInResult } from '../../lib/stores'

const okButtonText = '在浏览器中继续'

interface IWorkflowPushRejectedDialogProps {
  readonly rejectedPath: string
  readonly repository: RepositoryWithGitHubRepository
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
}
interface IWorkflowPushRejectedDialogState {
  readonly loading: boolean
}
/**
 * The dialog shown when a push is rejected due to it modifying a
 * workflow file without the workflow oauth scope.
 */
export class WorkflowPushRejectedDialog extends React.Component<
  IWorkflowPushRejectedDialogProps,
  IWorkflowPushRejectedDialogState
> {
  public constructor(props: IWorkflowPushRejectedDialogProps) {
    super(props)
    this.state = { loading: false }
  }

  public render() {
    return (
      <Dialog
        id="workflow-push-rejected"
        title="推送被拒绝"
        loading={this.state.loading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSignIn}
        type="error"
      >
        <DialogContent>
          <p>
            推送被服务器拒绝，因为其中包含对工作流文件{' '}
            <Ref>{this.props.rejectedPath}</Ref> 的修改。要能够推送工作流文件，
            GitHub Desktop 需要请求额外的权限。
          </p>
          <p>您要打开浏览器以授予 GitHub Desktop 更新工作流文件的权限吗？</p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup okButtonText={okButtonText} />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSignIn = async () => {
    this.setState({ loading: true })

    const { repository, dispatcher } = this.props
    const { endpoint } = repository.gitHubRepository

    const result = await new Promise<SignInResult>(async resolve => {
      dispatcher.beginBrowserBasedSignIn(endpoint, resolve)
    })

    if (result.kind === 'success') {
      dispatcher.push(repository)
    }

    this.props.onDismissed()
  }
}
