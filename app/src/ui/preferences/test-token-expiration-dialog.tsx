import * as React from 'react'
import { Account, getAccountKey } from '../../models/account'
import { IAccountTokenExpiration } from '../../lib/credential-sessions'
import { Dispatcher } from '../dispatcher'
import { Dialog, DialogContent, DialogError, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Button } from '../lib/button'
import { Select } from '../lib/select'
import { Row } from '../lib/row'

interface ITestTokenExpirationDialogProps {
  readonly accounts: ReadonlyArray<Account>
  readonly dispatcher: Pick<
    Dispatcher,
    | 'getAccountTokenExpirationForTesting'
    | 'setAccountTokenExpirationForTesting'
  >
  readonly onDismissed: () => void
}

interface ITestTokenExpirationDialogState {
  /** The selected account's `getAccountKey`, or '' when there is none. */
  readonly accountKey: string
  readonly expiration: IAccountTokenExpiration | null
  readonly dateTime: string
  readonly busy: boolean
  readonly error: string | null
  readonly message: string | null
}

function firstAccountKey(accounts: ReadonlyArray<Account>): string {
  const first = accounts.at(0)
  return first === undefined ? '' : getAccountKey(first)
}

function localDateTime(expiresAt: number | undefined): string {
  if (expiresAt === undefined) {
    return ''
  }
  const date = new Date(expiresAt)
  return new Date(expiresAt - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 19)
}

function describeExpiration(expiresAt: number | undefined): string {
  return expiresAt === undefined
    ? 'Unknown'
    : new Date(expiresAt).toLocaleString()
}

/** Session-only controls for exercising access-token expiration and renewal. */
export class TestTokenExpirationDialog extends React.Component<
  ITestTokenExpirationDialogProps,
  ITestTokenExpirationDialogState
> {
  private requestId = 0
  private readonly presets = [
    { label: '已过期', onClick: () => this.usePreset(-1) },
    { label: '10 分钟后', onClick: () => this.usePreset(10) },
    { label: '1 小时后', onClick: () => this.usePreset(60) },
    { label: '62 分钟后', onClick: () => this.usePreset(62) },
    { label: '8 小时后', onClick: () => this.usePreset(480) },
  ]

  public constructor(props: ITestTokenExpirationDialogProps) {
    super(props)
    this.state = {
      accountKey: firstAccountKey(props.accounts),
      expiration: null,
      dateTime: '',
      busy: false,
      error: null,
      message: null,
    }
  }

  public componentDidMount() {
    void this.loadExpiration()
  }

  public componentDidUpdate(prevProps: ITestTokenExpirationDialogProps) {
    const account = this.getSelectedAccount()
    const previousAccount = prevProps.accounts.find(
      a => getAccountKey(a) === this.state.accountKey
    )
    if (
      account === undefined &&
      (this.state.accountKey !== '' || this.props.accounts.length > 0)
    ) {
      this.setState(
        { accountKey: firstAccountKey(this.props.accounts) },
        this.loadExpiration
      )
    } else if (account !== previousAccount) {
      void this.loadExpiration()
    }
  }

  public componentWillUnmount() {
    this.requestId++
  }

  public render() {
    const { expiration, busy, error, dateTime, message } = this.state
    const disabled = busy || expiration?.isRefreshable !== true
    return (
      <Dialog
        id="test-token-expiration"
        title="测试令牌过期"
        onSubmit={this.onApply}
        onDismissed={this.props.onDismissed}
      >
        {error !== null && <DialogError>{error}</DialogError>}
        <DialogContent>
          <p>
            更改 Desktop 本地访问令牌的过期时间，而不是 GitHub
            令牌的实际有效期。覆盖设置会在令牌续期或应用重启时
            重置。此对话框不会显示或保存任何凭据。
          </p>
          {this.props.accounts.length === 0 ? (
            <p>
              请登录拥有可续期令牌的账号以测试过期行为。
            </p>
          ) : (
            <>
              <Row>
                <Select
                  label="账号"
                  value={this.state.accountKey}
                  disabled={busy}
                  onChange={this.onAccountChanged}
                >
                  {this.props.accounts.map(account => (
                    <option
                      key={getAccountKey(account)}
                      value={getAccountKey(account)}
                    >
                      {account.login} ({account.friendlyEndpoint})
                    </option>
                  ))}
                </Select>
              </Row>
              {expiration !== null && (
                <>
                  <p>
                    当前本地过期时间：{' '}
                    {describeExpiration(expiration.expiresAt)}
                    {expiration.isOverridden && '（已覆盖）'}
                  </p>
                  {expiration.isOverridden && (
                    <p>
                      原始到期时间：{' '}
                      {describeExpiration(expiration.originalExpiresAt)}
                    </p>
                  )}
                  {!expiration.isRefreshable && (
                    <p>
                      此账号没有可续期的令牌。请启用短期令牌后
                      重新登录，以测试过期行为。
                    </p>
                  )}
                </>
              )}
              <Row>
                <div className="text-box-component">
                  <label htmlFor="test-token-expiration-date-time">
                    过期时间（本地时间）
                  </label>
                  <input
                    id="test-token-expiration-date-time"
                    type="datetime-local"
                    step={1}
                    value={dateTime}
                    disabled={disabled}
                    required={true}
                    onChange={this.onDateTimeChanged}
                  />
                </div>
              </Row>
              <Row className="token-expiration-presets">
                {this.presets.map(preset => (
                  <Button
                    key={preset.label}
                    type="button"
                    disabled={disabled}
                    onClick={preset.onClick}
                  >
                    {preset.label}
                  </Button>
                ))}
              </Row>
              <p>
                普通请求会在到期前 10 分钟内续期。Copilot
                会话创建会在 61 分钟 1 秒内续期。
                续期会在经过身份验证的操作下次请求令牌时发生。
              </p>
              <Row>
                <Button
                  type="button"
                  disabled={busy || expiration?.isOverridden !== true}
                  onClick={this.onReset}
                >
                  重置覆盖设置
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={this.loadExpiration}
                >
                  重新加载详情
                </Button>
              </Row>
            </>
          )}
          {message !== null && <p role="status">{message}</p>}
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText="应用过期时间"
            okButtonDisabled={
              disabled || this.getChosenExpiration() === undefined
            }
            cancelButtonText="关闭"
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private getSelectedAccount() {
    return this.props.accounts.find(
      a => getAccountKey(a) === this.state.accountKey
    )
  }

  private getChosenExpiration(): number | undefined {
    const value = new Date(this.state.dateTime).getTime()
    return Number.isSafeInteger(value) && value >= 0 ? value : undefined
  }

  private loadExpiration = async () => {
    const id = ++this.requestId
    const account = this.getSelectedAccount()
    this.setState({
      expiration: null,
      busy: account !== undefined,
      error: null,
      message: null,
    })
    if (account === undefined) {
      return
    }
    try {
      const expiration =
        await this.props.dispatcher.getAccountTokenExpirationForTesting(account)
      if (id === this.requestId) {
        this.setState({
          expiration,
          dateTime: localDateTime(expiration.expiresAt),
          busy: false,
        })
      }
    } catch (error) {
      log.error('Unable to read test token expiration', error)
      if (id === this.requestId) {
        this.setState({
          error:
            error instanceof Error
              ? error.message
              : '无法读取令牌过期时间。详情请查看日志。',
          busy: false,
        })
      }
    }
  }

  private onAccountChanged = (event: React.FormEvent<HTMLSelectElement>) => {
    this.setState(
      { accountKey: event.currentTarget.value },
      this.loadExpiration
    )
  }

  private onDateTimeChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ dateTime: event.currentTarget.value, message: null })
  }

  private usePreset(minutes: number) {
    this.setState({
      dateTime: localDateTime(Date.now() + minutes * 60_000),
      message: null,
    })
  }

  private onApply = async () => {
    const expiresAt = this.getChosenExpiration()
    if (expiresAt === undefined) {
      this.setState({ error: '请选择有效的令牌过期日期和时间。' })
      return
    }
    await this.updateExpiration(expiresAt)
  }

  private onReset = () => this.updateExpiration(undefined)

  private async updateExpiration(expiresAt: number | undefined) {
    const account = this.getSelectedAccount()
    if (account === undefined) {
      this.setState({ error: '请选择一个已登录的账户。' })
      return
    }
    const id = ++this.requestId
    this.setState({ busy: true, error: null, message: null })
    try {
      const expiration =
        await this.props.dispatcher.setAccountTokenExpirationForTesting(
          account,
          expiresAt
        )
      if (id === this.requestId) {
        this.setState({
          expiration,
          dateTime: localDateTime(expiration.expiresAt),
          busy: false,
          message:
            expiresAt === undefined
              ? '已恢复原始过期时间。'
              : '已应用过期时间覆盖。',
        })
      }
    } catch (error) {
      log.error('Unable to change test token expiration', error)
      if (id === this.requestId) {
        this.setState({
          error:
            error instanceof Error
              ? error.message
              : '无法更改令牌过期时间。详情请查看日志。',
          busy: false,
        })
      }
    }
  }
}
