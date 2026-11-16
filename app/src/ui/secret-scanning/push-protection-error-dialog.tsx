import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { LinkButton } from '../lib/link-button'
import { PushProtectionErrorLocation } from './push-protection-error-location'
import { IAPICreatePushProtectionBypassResponse } from '../../lib/api'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

/** Represents the location of a detected secret detected on push  */
export interface ISecretLocation {
  /**The SHA of the commit where the secret was detected. */
  commitSha: string
  /** The file path where the secret is located. */
  path: string
  /** The line number in the file where the secret is found. */
  lineNumber: number
}

/** Represents secret detected by GitHub's Secret Scanning feature on push. */
export interface ISecretScanResult {
  /** The id used in the bypassURL to unique identify this secret */
  id: string
  /** The name of the secret - e.g "GitHub Access Token" */
  description: string
  /** The location of the secret, given as a commitSha, file path, and line number */
  locations: ReadonlyArray<ISecretLocation>
  /** The URL to use to get to GitHub.com's dialog for bypassing blocking the push of the secret  */
  bypassURL: string
  /** The user cannot bypass themselves, but can request a bypass */
  requiresApproval: boolean
}

interface IPushProtectionErrorDialogProps {
  /** The secrets that were detected on push */
  readonly secrets: ReadonlyArray<ISecretScanResult>

  /** The function to call when the user clicks the bypass button */
  readonly bypassPushProtection: (
    secret: ISecretScanResult
  ) => Promise<IAPICreatePushProtectionBypassResponse | null>

  readonly onDelegatedBypassLinkClick: () => void

  readonly onRemediationInstructionsLinkClick: () => void

  readonly onDismissed: () => void
}

interface IPushProtectionErrorDialogState {
  readonly secretsBypassed: Map<string, boolean>
}

/**
 * The dialog shown when a push is denied by GitHub's push protection feature of secret scanning.
 */
export class PushProtectionErrorDialog extends React.Component<
  IPushProtectionErrorDialogProps,
  IPushProtectionErrorDialogState
> {
  public constructor(props: IPushProtectionErrorDialogProps) {
    super(props)
    this.state = {
      secretsBypassed: new Map(),
    }
  }

  public render() {
    return (
      <Dialog
        title="推送被阻止：检测到密钥"
        onDismissed={this.props.onDismissed}
        onSubmit={this.props.onDismissed}
        type="error"
        role="alertdialog"
        ariaDescribedBy="push-protection-error-dialog-description"
        className="push-protection-error-dialog"
      >
        <DialogContent>
          <div id="push-protection-error-dialog-description">
            <p>
              <LinkButton uri="https://docs.github.com/code-security/secret-scanning/protecting-pushes-with-secret-scanning">
                密钥扫描
              </LinkButton>{' '}
              在您尝试推送的提交中发现了密钥。{' '}
            </p>
            <p>
              允许密钥存在会带来泄露风险。建议
              <LinkButton
                onClick={this.props.onRemediationInstructionsLinkClick}
                uri="https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection/working-with-push-protection-in-the-github-ui#resolving-a-blocked-commit"
              >
                从您的提交和提交历史中移除该密钥。
              </LinkButton>
            </p>
            暴露此密钥可能允许他人：
            <ul>
              <li>验证该密钥的身份</li>
              <li>了解该密钥可以访问哪些资源</li>
              <li>以该密钥所有者的身份执行操作</li>
              <li>在不被阻止的情况下将密钥推送到此仓库</li>
            </ul>
            {this.renderSecrets()}
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup cancelButtonVisible={false} />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderSecretDescription = (secret: ISecretScanResult) => {
    return this.props.secrets.filter(s => s.description === secret.description)
      .length > 1
      ? `${secret.description} (${secret.id})`
      : secret.description
  }

  private bypassSecret = (secret: ISecretScanResult) => {
    return async () => {
      const bypassed = await this.props.bypassPushProtection(secret)
      if (bypassed) {
        this.setState(prevState => ({
          secretsBypassed: new Map(prevState.secretsBypassed).set(
            secret.id,
            true
          ),
        }))
      }
    }
  }

  private renderBypassButton = (secret: ISecretScanResult) => {
    if (secret.requiresApproval) {
      return (
        <LinkButton
          ariaLabel={`Bypass ${secret.description}`}
          uri={secret.bypassURL}
          onClick={this.props.onDelegatedBypassLinkClick}
        >
          绕过
        </LinkButton>
      )
    }

    if (this.state.secretsBypassed.get(secret.id)) {
      return (
        <span className="bypass-success">
          已绕过 <Octicon symbol={octicons.check} className="bypass-success" />{' '}
        </span>
      )
    }

    return (
      <LinkButton
        ariaLabel={`Bypass ${secret.description}`}
        onClick={this.bypassSecret(secret)}
      >
        绕过
      </LinkButton>
    )
  }

  private renderSecrets = () => {
    const listItems = this.props.secrets.map((secret, index) => (
      <li key={index} className="secret-list-item">
        <span className="secret-list-item-header">
          <span>{this.renderSecretDescription(secret)}</span>
          {this.renderBypassButton(secret)}
        </span>
        <PushProtectionErrorLocation secret={secret} />
      </li>
    ))
    return (
      <ul aria-label="密钥" className="secret-list">
        {listItems}
      </ul>
    )
  }
}
