import * as React from 'react'
import {
  Account,
  isDotComAccount,
  isEnterpriseAccount,
} from '../../models/account'
import { IAvatarUser } from '../../models/avatar'
import { lookupPreferredEmail } from '../../lib/email'
import { assertNever } from '../../lib/fatal-error'
import { Button } from '../lib/button'
import { Row } from '../lib/row'
import { DialogContent, DialogPreferredFocusClassName } from '../dialog'
import { Avatar } from '../lib/avatar'
import { CallToAction } from '../lib/call-to-action'
import { groupAccountsByHost } from '../../lib/group-accounts-by-host'

interface IAccountsProps {
  readonly accounts: ReadonlyArray<Account>

  readonly onDotComSignIn: () => void
  readonly onEnterpriseSignIn: () => void
  readonly onLogout: (account: Account) => void
}

enum SignInType {
  DotCom,
  Enterprise,
}

export class Accounts extends React.Component<IAccountsProps, {}> {
  public render() {
    const { accounts } = this.props
    const dotComAccounts = accounts.filter(isDotComAccount)

    return (
      <DialogContent className="accounts-tab">
        <div className="accounts-section">
          <h2>GitHub.com</h2>
          {dotComAccounts.map(account =>
            this.renderAccount(account, SignInType.DotCom)
          )}
          {dotComAccounts.length === 0 ? (
            this.renderSignIn(SignInType.DotCom)
          ) : (
            <Button onClick={this.props.onDotComSignIn}>
              添加 GitHub.com 账号
            </Button>
          )}
        </div>

        <div className="accounts-section">
          <h2>GitHub Enterprise</h2>
          {this.renderMultipleEnterpriseAccounts()}
        </div>
      </DialogContent>
    )
  }

  private renderMultipleEnterpriseAccounts() {
    const enterpriseAccounts = this.props.accounts.filter(isEnterpriseAccount)

    if (enterpriseAccounts.length === 0) {
      return this.renderSignIn(SignInType.Enterprise)
    }

    return (
      <>
        {groupAccountsByHost(enterpriseAccounts).map(([host, accounts]) => {
          const headingId = `enterprise-accounts-${host}`
          return (
            <section
              key={host}
              className="enterprise-host"
              aria-labelledby={headingId}
            >
              <h3 id={headingId}>{host}</h3>
              {accounts.map(account =>
                this.renderAccount(account, SignInType.Enterprise)
              )}
            </section>
          )
        })}
        <Button onClick={this.props.onEnterpriseSignIn}>
          添加 GitHub Enterprise 账号
        </Button>
      </>
    )
  }

  private renderAccount(account: Account, type: SignInType) {
    const avatarUser: IAvatarUser = {
      name: account.name,
      email: lookupPreferredEmail(account),
      avatarURL: account.avatarURL,
      endpoint: account.endpoint,
    }

    // The DotCom account is shown first, so its sign in/out button should be
    // focused initially when the dialog is opened.
    const className =
      type === SignInType.DotCom ? DialogPreferredFocusClassName : undefined

    return (
      <Row
        key={JSON.stringify([
          account.endpoint.toLowerCase(),
          account.login.toLowerCase(),
        ])}
        className="account-info"
      >
        <div className="user-info-container">
          <Avatar accounts={this.props.accounts} user={avatarUser} />
          <div className="user-info">
            <div className="name">{account.name}</div>
            <div className="login">@{account.login}</div>
          </div>
        </div>
        <Button onClick={this.logout(account)} className={className}>
          退出登录
        </Button>
      </Row>
    )
  }

  private onDotComSignIn = () => {
    this.props.onDotComSignIn()
  }

  private onEnterpriseSignIn = () => {
    this.props.onEnterpriseSignIn()
  }

  private renderSignIn(type: SignInType) {
    const signInTitle = '登录'
    switch (type) {
      case SignInType.DotCom: {
        return (
          <CallToAction
            actionTitle={signInTitle + ' GitHub.com'}
            onAction={this.onDotComSignIn}
            // The DotCom account is shown first, so its sign in/out button should be
            // focused initially when the dialog is opened.
            buttonClassName={DialogPreferredFocusClassName}
          >
            <div>
              登录您的 GitHub.com 账号以访问您的仓库。
            </div>
          </CallToAction>
        )
      }
      case SignInType.Enterprise:
        return (
          <CallToAction
            actionTitle={signInTitle + ' GitHub Enterprise'}
            onAction={this.onEnterpriseSignIn}
          >
            <div>
              如果您在工作中使用 GitHub Enterprise，请登录以访问您的仓库。
            </div>
          </CallToAction>
        )
      default:
        return assertNever(type, `Unknown sign in type: ${type}`)
    }
  }

  private logout = (account: Account) => {
    return () => {
      this.props.onLogout(account)
    }
  }
}
