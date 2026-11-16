import * as React from 'react'
import { Dispatcher } from '../dispatcher'
import { DialogFooter, DialogContent, Dialog } from '../dialog'
import { FetchType } from '../../models/fetch'
import { Repository } from '../../models/repository'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IPushNeedsPullWarningProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly onDismissed: () => void
}

interface IPushNeedsPullWarningState {
  readonly isLoading: boolean
}

export class PushNeedsPullWarning extends React.Component<
  IPushNeedsPullWarningProps,
  IPushNeedsPullWarningState
> {
  public constructor(props: IPushNeedsPullWarningProps) {
    super(props)

    this.state = {
      isLoading: false,
    }
  }

  public render() {
    return (
      <Dialog
        title="远程有更新的提交"
        dismissDisabled={this.state.isLoading}
        disabled={this.state.isLoading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onFetch}
        loading={this.state.isLoading}
        type="warning"
      >
        <DialogContent>
          <p>
            GitHub Desktop
            无法向此分支推送提交，因为远程存在本地分支中没有的提交。
            请先获取这些新提交，然后才能推送，以便将它们与本地提交合并。
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText="获取"
            okButtonDisabled={this.state.isLoading}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onFetch = async () => {
    this.setState({ isLoading: true })
    await this.props.dispatcher.fetch(
      this.props.repository,
      FetchType.UserInitiatedTask
    )
    this.setState({ isLoading: false })
    this.props.onDismissed()
  }
}
