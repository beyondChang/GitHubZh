import * as React from 'react'
import { Dispatcher } from '../dispatcher'
import {
  SignInState,
  SignInStep,
  IEndpointEntryState,
  IAuthenticationState,
} from '../../lib/stores'
import { assertNever } from '../../lib/fatal-error'
import { Row } from '../lib/row'
import { TextBox } from '../lib/text-box'
import { Dialog, DialogError, DialogContent, DialogFooter } from '../dialog'

import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Ref } from '../lib/ref'
import { PopupType } from '../../models/popup'
import { getHTMLURL } from '../../lib/api'
import {
  EnterpriseServerConfirmation,
  enterpriseServerConfirmationDescriptionId,
} from '../lib/enterprise-server-confirmation'

interface ISignInProps {
  readonly dispatcher: Dispatcher
  readonly signInState: SignInState | null
  readonly onDismissed: () => void
}

interface ISignInState {
  readonly endpoint: string
}

const SignInWithBrowserTitle = __DARWIN__
  ? '使用浏览器登录'
  : '使用浏览器登录'

const DefaultTitle = '登录'

const browserSignInInfoContent = (
  <p>
    登录后，您的浏览器会将您重定向回 GitHub Desktop。
    如果浏览器询问您是否允许启动 GitHub Desktop，请
    予以允许。
  </p>
)

export class SignIn extends React.Component<ISignInProps, ISignInState> {
  private readonly dialogRef = React.createRef<Dialog>()

  public constructor(props: ISignInProps) {
    super(props)

    this.state = {
      endpoint: '',
    }
  }

  public componentDidUpdate(prevProps: ISignInProps) {
    // Whenever the sign in step changes we replace the dialog contents which
    // means we need to re-focus the first suitable child element as it's
    // essentially a "new" dialog we're showing only the dialog component itself
    // doesn't know that.
    if (prevProps.signInState !== null && this.props.signInState !== null) {
      if (prevProps.signInState.kind !== this.props.signInState.kind) {
        this.dialogRef.current?.focusFirstSuitableChild()
      }
    }
  }

  public componentWillReceiveProps(nextProps: ISignInProps) {
    if (
      this.props.signInState?.kind !== SignInStep.Success &&
      nextProps.signInState?.kind === SignInStep.Success
    ) {
      // The result callback may already have closed this and its parent dialog.
      this.props.dispatcher.closePopup(PopupType.SignIn)
    }
  }

  private onSubmit = () => {
    const state = this.props.signInState

    if (!state) {
      return
    }

    const stepKind = state.kind

    switch (state.kind) {
      case SignInStep.EndpointEntry:
        this.props.dispatcher.setSignInEndpoint(this.state.endpoint)
        break
      case SignInStep.Authentication:
        this.props.dispatcher.requestBrowserAuthentication()
        break
      case SignInStep.Success:
        break
      default:
        assertNever(state, `Unknown sign in step ${stepKind}`)
    }
  }

  private onEndpointChanged = (endpoint: string) => {
    this.setState({ endpoint })
  }

  private renderFooter(): JSX.Element | null {
    const state = this.props.signInState

    if (!state || state.kind === SignInStep.Success) {
      return null
    }

    let disableSubmit = false

    let primaryButtonText: string
    const stepKind = state.kind
    const continueWithBrowserLabel = __DARWIN__
      ? '使用浏览器继续'
      : '使用浏览器继续'

    switch (state.kind) {
      case SignInStep.EndpointEntry:
        disableSubmit = this.state.endpoint.length === 0
        primaryButtonText = 'Continue'
        break
      case SignInStep.Authentication:
        primaryButtonText = continueWithBrowserLabel
        break
      default:
        return assertNever(state, `Unknown sign in step ${stepKind}`)
    }

    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText={primaryButtonText}
          okButtonDisabled={disableSubmit || state.loading}
          cancelButtonDisabled={false}
          onCancelButtonClick={this.onDismissed}
        />
      </DialogFooter>
    )
  }

  private renderEndpointEntryStep(state: IEndpointEntryState) {
    return (
      <DialogContent>
        <Row>
          <TextBox
            label="企业版地址"
            value={this.state.endpoint}
            onValueChanged={this.onEndpointChanged}
            placeholder="https://example.ghe.com"
          />
        </Row>
      </DialogContent>
    )
  }

  private renderAuthenticationStep(state: IAuthenticationState) {
    if (state.isUnrecognizedEnterpriseServer) {
      return (
        <DialogContent>
          <EnterpriseServerConfirmation endpoint={state.endpoint} />
          {browserSignInInfoContent}
        </DialogContent>
      )
    }

    return (
      <DialogContent>
        {state.expectedLogin !== undefined && (
          <p>
            以 <Ref>{state.expectedLogin}</Ref> 的身份在{' '}
            <Ref>{new URL(getHTMLURL(state.endpoint)).host}</Ref> 上登录以继续。
          </p>
        )}
        {browserSignInInfoContent}
      </DialogContent>
    )
  }

  private renderStep(): JSX.Element | null {
    const state = this.props.signInState

    if (!state) {
      return null
    }

    const stepKind = state.kind

    switch (state.kind) {
      case SignInStep.EndpointEntry:
        return this.renderEndpointEntryStep(state)
      case SignInStep.Authentication:
        return this.renderAuthenticationStep(state)
      case SignInStep.Success:
        return null
      default:
        return assertNever(state, `Unknown sign in step ${stepKind}`)
    }
  }

  public render() {
    const state = this.props.signInState

    if (!state || state.kind === SignInStep.Success) {
      return null
    }

    const errors = state.error ? (
      <DialogError>{state.error.message}</DialogError>
    ) : null

    const title =
      state.kind === SignInStep.Authentication
        ? SignInWithBrowserTitle
        : DefaultTitle

    const confirmationDialogProps =
      state.kind === SignInStep.Authentication &&
      state.isUnrecognizedEnterpriseServer
        ? {
            role: 'alertdialog' as const,
            ariaDescribedBy: enterpriseServerConfirmationDescriptionId,
          }
        : {}

    return (
      <Dialog
        id="sign-in"
        title={title}
        disabled={false}
        onDismissed={this.onDismissed}
        onSubmit={this.onSubmit}
        loading={state.loading}
        ref={this.dialogRef}
        {...confirmationDialogProps}
      >
        {errors}
        {this.renderStep()}
        {this.renderFooter()}
      </Dialog>
    )
  }

  private onDismissed = () => {
    if (
      this.props.signInState === null ||
      this.props.signInState.kind === SignInStep.Success
    ) {
      return
    }
    this.props.dispatcher.resetSignInState()
    this.props.onDismissed()
  }
}
