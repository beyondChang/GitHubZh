import React from 'react'
import { Select } from '../lib/select'
import { Button } from '../lib/button'
import { Row } from '../lib/row'
import {
  Popover,
  PopoverAnchorPosition,
  PopoverDecoration,
} from '../lib/popover'
import { IAvatarUser } from '../../models/avatar'
import { Avatar } from '../lib/avatar'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { LinkButton } from '../lib/link-button'
import { OkCancelButtonGroup } from '../dialog'
import { getConfigValue } from '../../lib/git/config'
import { Repository } from '../../models/repository'
import classNames from 'classnames'
import { RepoRulesMetadataFailures } from '../../models/repo-rules'
import { RepoRulesMetadataFailureList } from '../repository-rules/repo-rules-failure-list'
import { Account } from '../../models/account'

export type CommitMessageAvatarWarningType =
  | 'none'
  | 'misattribution'
  | 'disallowedEmail'

interface ICommitMessageAvatarState {
  readonly isPopoverOpen: boolean

  /** Currently selected account email address. */
  readonly accountEmail: string

  /** Whether the git configuration is local to the repository or global  */
  readonly isGitConfigLocal: boolean
}

interface ICommitMessageAvatarProps {
  /** The user whose avatar should be displayed. */
  readonly user?: IAvatarUser

  /** Current email address configured by the user. */
  readonly email?: string

  /**
   * Controls whether a warning should be displayed.
   * - 'none': No error is displayed, the field is valid.
   * - 'misattribution': The user's Git config emails don't match and the
   * commit may not be attributed to the user.
   * - 'disallowedEmail': A repository rule may prevent the user from
   * committing with the selected email address.
   */
  readonly warningType: CommitMessageAvatarWarningType

  /**
   * List of validations that failed for repo rules. Only used if
   * `warningType` is 'disallowedEmail'.
   */
  readonly emailRuleFailures?: RepoRulesMetadataFailures

  /**
   * Name of the current branch
   */
  readonly branch: string | null

  /** Whether or not the user's account is a GHE account. */
  readonly isEnterpriseAccount: boolean

  /** Email addresses available in the relevant GitHub (Enterprise) account. */
  readonly accountEmails: ReadonlyArray<string>

  /** Preferred email address from the user's account. */
  readonly preferredAccountEmail: string

  /**
   * The currently selected repository
   */
  readonly repository: Repository

  /** Whether the manual author controls are active. Defaults to true. */
  readonly isActive?: boolean

  readonly onUpdateEmail: (email: string) => void

  /**
   * Called when the user has requested to see the Git Config tab in the
   * repository settings dialog
   */
  readonly onOpenRepositorySettings: () => void

  /**
   * Called when the user has requested to see the Git tab in the user settings
   * dialog
   */
  readonly onOpenGitSettings: () => void

  readonly accounts: ReadonlyArray<Account>
}

/**
 * User avatar shown in the commit message area. It encapsulates not only the
 * user avatar, but also any badge and warning we might display to the user.
 */
export class CommitMessageAvatar extends React.Component<
  ICommitMessageAvatarProps,
  ICommitMessageAvatarState
> {
  private avatarButtonRef: HTMLButtonElement | null = null
  private warningBadgeRef = React.createRef<HTMLDivElement>()
  private gitConfigLocationRequestID = 0

  public constructor(props: ICommitMessageAvatarProps) {
    super(props)

    this.state = {
      isPopoverOpen: false,
      accountEmail: this.props.preferredAccountEmail,
      isGitConfigLocal: false,
    }
    if (props.isActive !== false) {
      this.determineGitConfigLocation()
    }
  }

  public componentDidUpdate(prevProps: ICommitMessageAvatarProps) {
    if (this.props.isActive === false && prevProps.isActive !== false) {
      this.gitConfigLocationRequestID++
    }
    if (this.props.isActive === false && this.state.isPopoverOpen) {
      this.closePopover()
    }

    if (
      this.props.isActive !== false &&
      (prevProps.isActive === false ||
        this.props.user?.name !== prevProps.user?.name ||
        this.props.user?.email !== prevProps.user?.email ||
        this.props.repository.path !== prevProps.repository.path)
    ) {
      this.determineGitConfigLocation()
    }

    if (
      this.props.preferredAccountEmail !== prevProps.preferredAccountEmail &&
      this.state.accountEmail === prevProps.preferredAccountEmail
    ) {
      this.setState({ accountEmail: this.props.preferredAccountEmail })
    }
  }

  public componentWillUnmount() {
    this.gitConfigLocationRequestID++
  }

  private async determineGitConfigLocation() {
    const requestID = ++this.gitConfigLocationRequestID
    const isGitConfigLocal = await this.isGitConfigLocal(requestID)
    if (
      this.avatarButtonRef !== null &&
      requestID === this.gitConfigLocationRequestID
    ) {
      this.setState({ isGitConfigLocal })
    }
  }

  private isGitConfigLocal = async (requestID: number) => {
    const { repository } = this.props
    const localName = await getConfigValue(repository, 'user.name', true)
    if (
      requestID !== this.gitConfigLocationRequestID ||
      this.props.isActive === false
    ) {
      return false
    }
    const localEmail = await getConfigValue(repository, 'user.email', true)
    return localName !== null || localEmail !== null
  }

  private onButtonRef = (buttonRef: HTMLButtonElement | null) => {
    this.avatarButtonRef = buttonRef
  }

  public render() {
    const { warningType, user } = this.props

    let ariaLabel = ''
    switch (warningType) {
      case 'none':
        ariaLabel = '查看提交作者信息'
        break

      case 'misattribution':
        ariaLabel = '此提交可能被错误归属。查看警告。'
        break

      case 'disallowedEmail':
        ariaLabel = '不允许使用此电子邮件地址。查看警告。'
        break
    }

    const classes = classNames('commit-message-avatar-component', {
      misattributed: warningType !== 'none',
    })

    return (
      <div className={classes}>
        <Button
          className="avatar-button"
          ariaLabel={ariaLabel}
          onButtonRef={this.onButtonRef}
          onClick={this.onAvatarClick}
        >
          {warningType !== 'none' && this.renderWarningBadge()}
          <Avatar accounts={this.props.accounts} user={user} title={null} />
        </Button>
        {this.props.isActive !== false &&
          this.state.isPopoverOpen &&
          this.renderPopover()}
      </div>
    )
  }

  private renderWarningBadge() {
    const { warningType, emailRuleFailures } = this.props

    // the parent component only renders this one if an error/warning is present, so we
    // only need to check which of the two it is here
    const isError =
      warningType === 'disallowedEmail' && emailRuleFailures?.status === 'fail'
    const classes = classNames('warning-badge', {
      error: isError,
      warning: !isError,
    })
    const symbol = isError ? octicons.stop : octicons.alert

    return (
      <div className={classes} ref={this.warningBadgeRef}>
        <Octicon symbol={symbol} />
      </div>
    )
  }

  private openPopover = () => {
    this.setState(prevState => {
      if (prevState.isPopoverOpen === false) {
        return { isPopoverOpen: true }
      }
      return null
    })
  }

  private closePopover = () => {
    this.setState(prevState => {
      if (prevState.isPopoverOpen) {
        return { isPopoverOpen: false }
      }
      return null
    })
  }

  private onAvatarClick = (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (this.props.isActive === false) {
      return
    }
    if (this.state.isPopoverOpen) {
      this.closePopover()
    } else {
      this.openPopover()
    }
  }

  private renderGitConfigPopover() {
    const { user } = this.props
    const { isGitConfigLocal } = this.state

    const location = isGitConfigLocal ? '本地' : '全局'
    const locationDesc = isGitConfigLocal ? '（仅适用于您的仓库）' : ''
    const settingsName = __DARWIN__ ? '设置' : '选项'
    const settings = isGitConfigLocal ? '仓库设置' : `Git ${settingsName}`
    const buttonText = '打开 Git 设置'

    return (
      <>
        <p>{user && user.name && `电子邮件：${user.email}`}</p>

        <p>
          您可以在您的 {settings} 中更新{location} Git 配置{locationDesc}。
        </p>

        {!isGitConfigLocal && (
          <p className="secondary-text">
            您也可以从
            <LinkButton onClick={this.onRepositorySettingsClick}>
              仓库设置
            </LinkButton>
            。
          </p>
        )}
        <Row className="button-row">
          <OkCancelButtonGroup
            okButtonText={buttonText}
            onOkButtonClick={this.onOpenGitSettings}
            onCancelButtonClick={this.onIgnoreClick}
          />
        </Row>
      </>
    )
  }

  private renderWarningPopover() {
    const { warningType, emailRuleFailures } = this.props

    const updateEmailTitle = '更新电子邮件'

    const sharedHeader = (
      <>
        您的全局 Git 配置中的电子邮件（
        <span className="git-email">{this.props.email}</span>)
      </>
    )

    const hasEmails = this.props.accountEmails.length > 0

    const sharedFooter = (
      <>
        {hasEmails && (
          <Row>
            <Select
              label="您的账号电子邮件"
              value={this.state.accountEmail}
              onChange={this.onSelectedGitHubEmailChange}
            >
              {this.props.accountEmails.map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Row>
        )}
        <Row>
          <div className="secondary-text">
            您{hasEmails ? '还可以' : '可以'}从
            <LinkButton onClick={this.onRepositorySettingsClick}>
              仓库设置
            </LinkButton>
            。
          </div>
        </Row>
        <Row className="button-row">
          <Button onClick={this.onIgnoreClick} type="button">
            忽略
          </Button>
          {hasEmails && (
            <Button onClick={this.onUpdateEmailClick} type="submit">
              {updateEmailTitle}
            </Button>
          )}
        </Row>
      </>
    )

    if (warningType === 'misattribution') {
      const accountTypeSuffix = this.props.isEnterpriseAccount ? ' 企业版' : ''

      const userName =
        this.props.user && this.props.user.name ? ` ${this.props.user.name}` : ''

      return (
        <>
          <Row>
            <div>
              {sharedHeader} 与您的 GitHub{accountTypeSuffix} 账号{userName}不匹配。{' '}
              <LinkButton
                ariaLabel="详细了解提交归属"
                uri="https://docs.github.com/en/github/committing-changes-to-your-project/why-are-my-commits-linked-to-the-wrong-user"
              >
                详细了解
              </LinkButton>
            </div>
          </Row>
          {sharedFooter}
        </>
      )
    } else if (
      warningType === 'disallowedEmail' &&
      emailRuleFailures &&
      this.props.branch &&
      this.props.repository.gitHubRepository
    ) {
      return (
        <>
          <RepoRulesMetadataFailureList
            repository={this.props.repository.gitHubRepository}
            branch={this.props.branch}
            failures={emailRuleFailures}
            leadingText={sharedHeader}
          />
          {sharedFooter}
        </>
      )
    }

    return
  }

  private getCommittingAsTitle(): string | JSX.Element | undefined {
    const { user } = this.props

    if (user === undefined) {
      return '未知用户'
    }

    const { name, email } = user

    if (name) {
      return (
        <>
          以 <strong>{name}</strong> 身份提交
        </>
      )
    }

    return <>使用 {email} 提交</>
  }

  private renderPopover() {
    const { warningType } = this.props

    let header: string | JSX.Element | undefined = ''
    switch (this.props.warningType) {
      case 'misattribution':
        header = '此提交将被错误归属'
        break

      case 'disallowedEmail':
        header = '不允许使用此电子邮件地址'
        break

      default:
        header = this.getCommittingAsTitle()
        break
    }

    return (
      <Popover
        anchor={
          warningType !== 'none'
            ? this.warningBadgeRef.current
            : this.avatarButtonRef
        }
        anchorPosition={PopoverAnchorPosition.RightBottom}
        decoration={PopoverDecoration.Balloon}
        onMousedownOutside={this.closePopover}
        onClickOutside={this.closePopover}
        ariaLabelledby="commit-avatar-popover-header"
      >
        <h3 id="commit-avatar-popover-header">{header}</h3>

        {warningType !== 'none'
          ? this.renderWarningPopover()
          : this.renderGitConfigPopover()}
      </Popover>
    )
  }

  private onRepositorySettingsClick = () => {
    this.closePopover()
    this.props.onOpenRepositorySettings()
  }

  private onOpenGitSettings = () => {
    this.closePopover()
    if (this.state.isGitConfigLocal) {
      this.props.onOpenRepositorySettings()
    } else {
      this.props.onOpenGitSettings()
    }
  }

  private onIgnoreClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    this.closePopover()
  }

  private onUpdateEmailClick = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault()
    this.closePopover()

    if (this.props.email !== this.state.accountEmail) {
      this.props.onUpdateEmail(this.state.accountEmail)
    }
  }

  private onSelectedGitHubEmailChange = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const email = event.currentTarget.value
    if (email) {
      this.setState({ accountEmail: email })
    }
  }
}
