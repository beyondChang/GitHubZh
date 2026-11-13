import * as React from 'react'
import { Account } from '../../models/account'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Checkbox, CheckboxValue } from '../lib/checkbox'

interface IConfirmAccountSignOutProps {
  readonly account: Account
  readonly repositoryCount: number
  readonly onComplete: (clearAssignments: boolean | undefined) => void
  readonly onDismissed: () => void
}

interface IConfirmAccountSignOutState {
  readonly clearAssignments: boolean
}

/** Confirms sign-out and whether repository assignments should be cleared. */
export class ConfirmAccountSignOut extends React.Component<
  IConfirmAccountSignOutProps,
  IConfirmAccountSignOutState
> {
  public constructor(props: IConfirmAccountSignOutProps) {
    super(props)
    this.state = { clearAssignments: false }
  }

  private onChange = (event: React.FormEvent<HTMLInputElement>) => {
    this.setState({ clearAssignments: event.currentTarget.checked })
  }

  private onSubmit = () => {
    this.props.onComplete(this.state.clearAssignments)
    this.props.onDismissed()
  }

  private onDismissed = () => {
    this.props.onComplete(undefined)
    this.props.onDismissed()
  }

  public render() {
    const { account, repositoryCount } = this.props
    return (
      <Dialog
        id="confirm-account-sign-out"
        title={`退出 @${account.login}？`}
        onSubmit={this.onSubmit}
        onDismissed={this.onDismissed}
      >
        <DialogContent>
          <p>
            在 {account.friendlyEndpoint} 上有 {repositoryCount} 个仓库分配给了 @{account.login}。
          </p>
          <p>
            保留这些分配可在您再次登录时继续使用此账号；清除后，下次使用这些仓库时需要重新选择账号。
          </p>
          <Checkbox
            label="清除仓库账号分配"
            value={
              this.state.clearAssignments ? CheckboxValue.On : CheckboxValue.Off
            }
            onChange={this.onChange}
          />
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup okButtonText="退出登录" />
        </DialogFooter>
      </Dialog>
    )
  }
}
