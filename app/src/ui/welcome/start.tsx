import * as React from 'react'
import { WelcomeStep } from './welcome'
import { LinkButton } from '../lib/link-button'
import { Dispatcher } from '../dispatcher'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Button } from '../lib/button'
import { Loading } from '../lib/loading'
import { BrowserRedirectMessage } from '../lib/authentication-form'
import { SamplesURL } from '../../lib/stats'

/**
 * The URL to the sign-up page on GitHub.com. Used in conjunction
 * with account actions in the app where the user might want to
 * consider signing up.
 */
export const CreateAccountURL = 'https://github.com/join?source=github-desktop'

interface IStartProps {
  readonly advance: (step: WelcomeStep) => void
  readonly dispatcher: Dispatcher
  readonly loadingBrowserAuth: boolean
}

/** The first step of the Welcome flow. */
export class Start extends React.Component<IStartProps, {}> {
  public render() {
    return (
      <section
        id="start"
        aria-label="欢迎使用 GitHub Desktop"
        aria-describedby="start-description"
      >
        <div className="start-content">
          <h1 className="welcome-title">
            欢迎使用 <span>GitHub Desktop</span>
          </h1>
          {!this.props.loadingBrowserAuth ? (
            <>
              <p id="start-description" className="welcome-text">
                GitHub Desktop 是您在 GitHub 和 GitHub Enterprise 上参与项目的无缝方式。
                登录即可开始使用您现有的项目。
              </p>
            </>
          ) : (
            <p>{BrowserRedirectMessage}</p>
          )}

          <div className="welcome-main-buttons">
            <Button
              type="submit"
              className="button-with-icon"
              disabled={this.props.loadingBrowserAuth}
              onClick={this.signInWithBrowser}
              autoFocus={true}
              role="link"
            >
              {this.props.loadingBrowserAuth && <Loading />}
              登录 GitHub.com
              <Octicon symbol={octicons.linkExternal} />
            </Button>
            {this.props.loadingBrowserAuth ? (
              <Button onClick={this.cancelBrowserAuth}>取消</Button>
            ) : (
              <Button onClick={this.signInToEnterprise}>
                登录 GitHub Enterprise
              </Button>
            )}
          </div>
          <div className="skip-action-container">
            <p className="welcome-text">
              还没有 GitHub 账号？{' '}
              <LinkButton
                uri={CreateAccountURL}
                className="create-account-link"
              >
                创建免费账号。
              </LinkButton>
            </p>
            <LinkButton className="skip-button" onClick={this.skip}>
              跳过此步骤
            </LinkButton>
          </div>
        </div>

        <div className="start-footer">
          <p>
            创建账号即表示您同意{' '}
            <LinkButton uri={'https://github.com/site/terms'}>
              《服务条款》
            </LinkButton>
            。如需了解更多 GitHub 隐私政策，请参阅{' '}
            <LinkButton uri={'https://github.com/site/privacy'}>
              GitHub 隐私声明。
            </LinkButton>
          </p>
          <p>
            GitHub Desktop 会发送使用情况统计，以改进产品并协助做出功能决策。
            {' '}
            <LinkButton uri={SamplesURL}>
              了解有关用户统计的更多信息。
            </LinkButton>
          </p>
        </div>
      </section>
    )
  }

  private signInWithBrowser = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault()
    }

    this.props.advance(WelcomeStep.SignInToDotComWithBrowser)
    this.props.dispatcher.requestBrowserAuthenticationToDotcom()
  }

  private cancelBrowserAuth = () => {
    this.props.advance(WelcomeStep.Start)
  }

  private signInToEnterprise = () => {
    this.props.advance(WelcomeStep.SignInToEnterprise)
  }

  private skip = () => {
    this.props.advance(WelcomeStep.ConfigureGit)
  }
}
