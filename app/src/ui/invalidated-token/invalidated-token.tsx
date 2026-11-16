import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Dispatcher } from '../dispatcher'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Account } from '../../models/account'
import { Ref } from '../lib/ref'

interface IInvalidatedTokenProps {
  readonly dispatcher: Pick<Dispatcher, 'showAccountSignInDialog'>
  readonly account: Account
  readonly onDismissed: () => void
}

/**
 * Dialog that alerts user that their GitHub (Enterprise) account token is not
 * valid and they need to sign in again.
 */
export class InvalidatedToken extends React.Component<IInvalidatedTokenProps> {
  public render() {
    const { account } = this.props

    return (
      <Dialog
        id="invalidated-token"
        type="warning"
        title={'账号令牌已失效'}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          您的账号令牌已不再有效，您已从 <Ref>{account.friendlyEndpoint}</Ref>{' '}
          上的 <Ref>{account.login}</Ref> 账号退出。是否要重新登录？
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup okButtonText="是" cancelButtonText="否" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onSubmit = () => {
    const { dispatcher, onDismissed, account } = this.props

    onDismissed()

    // Other accounts may still be signed in to the same endpoint, so sign
    // back in to this specific account rather than any account.
    dispatcher.showAccountSignInDialog(account.endpoint, account.login)
  }
}
