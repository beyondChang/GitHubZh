import * as React from 'react'
import * as URL from 'url'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'

interface IUntrustedCertificateProps {
  /** The untrusted certificate. */
  readonly certificate: Electron.Certificate

  /** The URL which was being accessed. */
  readonly url: string

  /** The function to call when the user chooses to dismiss the dialog. */
  readonly onDismissed: () => void

  /**
   * The function to call when the user chooses to continue in the process of
   * trusting the certificate.
   */
  readonly onContinue: (certificate: Electron.Certificate) => void
}

/**
 * The dialog we display when an API request encounters an untrusted
 * certificate.
 *
 * An easy way to test this dialog is to attempt to sign in to GitHub
 * Enterprise using  one of the badssl.com domains, such
 * as https://self-signed.badssl.com/
 */
export class UntrustedCertificate extends React.Component<
  IUntrustedCertificateProps,
  {}
> {
  public render() {
    const host = URL.parse(this.props.url).hostname

    return (
      <Dialog
        title="服务器不受信任"
        onDismissed={this.props.onDismissed}
        onSubmit={this.onContinue}
        type={__DARWIN__ ? 'warning' : 'error'}
      >
        <DialogContent>
          <p>
            GitHub Desktop 无法验证 {host} 的身份。证书 （
            {this.props.certificate.subjectName}）无效或不受信任。{' '}
            <strong>这可能表明攻击者正试图窃取您的数据。</strong>
          </p>
          <p>在某些情况下，这可能是预期行为。例如：</p>
          <ul>
            <li>如果这是 GitHub Enterprise 试用版。</li>
            <li>如果您的 GitHub Enterprise 实例运行在不寻常的顶级域名上。</li>
          </ul>
          <p>如果您不确定该怎么做，请取消并联系您的系统管理员。</p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup destructive={true} okButtonText="添加证书" />
        </DialogFooter>
      </Dialog>
    )
  }

  private onContinue = () => {
    this.props.onDismissed()
    this.props.onContinue(this.props.certificate)
  }
}
