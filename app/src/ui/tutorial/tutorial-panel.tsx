import * as React from 'react'
import { join } from 'path'
import { LinkButton } from '../lib/link-button'
import { Button } from '../lib/button'
import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import {
  ValidTutorialStep,
  TutorialStep,
  orderedTutorialSteps,
} from '../../models/tutorial-step'
import { encodePathAsUrl } from '../../lib/path'
import { PopupType } from '../../models/popup'
import { PreferencesTab } from '../../models/preferences'
import { Ref } from '../lib/ref'
import { suggestedExternalEditor } from '../../lib/editors/shared'
import { TutorialStepInstructions } from './tutorial-step-instruction'
import { KeyboardShortcut } from '../keyboard-shortcut/keyboard-shortcut'

const TutorialPanelImage = encodePathAsUrl(
  __dirname,
  'static/required-status-check.svg'
)

interface ITutorialPanelProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository

  /** name of the configured external editor
   * (`undefined` if none is configured.)
   */
  readonly resolvedExternalEditor: string | null
  readonly currentTutorialStep: ValidTutorialStep
  readonly onExitTutorial: () => void
}

interface ITutorialPanelState {
  /** ID of the currently expanded tutorial step */
  readonly currentlyOpenSectionId: ValidTutorialStep
}

/** The Onboarding Tutorial Panel
 *  Renders a list of expandable tutorial steps (`TutorialListItem`).
 *  Enforces only having one step expanded at a time through
 *  event callbacks and local state.
 */
export class TutorialPanel extends React.Component<
  ITutorialPanelProps,
  ITutorialPanelState
> {
  public constructor(props: ITutorialPanelProps) {
    super(props)
    this.state = { currentlyOpenSectionId: this.props.currentTutorialStep }
  }

  private openTutorialFileInEditor = () => {
    this.props.dispatcher.openInExternalEditor(
      // TODO: tie this filename to a shared constant
      // for tutorial repos
      join(this.props.repository.path, 'README.md')
    )
  }

  private openPullRequest = () => {
    // This will cause the tutorial pull request step to close first.
    this.props.dispatcher.markPullRequestTutorialStepAsComplete(
      this.props.repository
    )

    // wait for the tutorial step to close before opening the PR, so that the
    // focusing of the "You're Done!" header is not interupted.
    setTimeout(() => {
      this.props.dispatcher.createPullRequest(this.props.repository)
    }, 500)
  }

  private skipEditorInstall = () => {
    this.props.dispatcher.skipPickEditorTutorialStep(this.props.repository)
  }

  private skipCreatePR = () => {
    this.props.dispatcher.markPullRequestTutorialStepAsComplete(
      this.props.repository
    )
  }

  private isStepComplete = (step: ValidTutorialStep) => {
    return (
      orderedTutorialSteps.indexOf(step) <
      orderedTutorialSteps.indexOf(this.props.currentTutorialStep)
    )
  }

  private isStepNextTodo = (step: ValidTutorialStep) => {
    return step === this.props.currentTutorialStep
  }

  public componentWillReceiveProps(nextProps: ITutorialPanelProps) {
    if (this.props.currentTutorialStep !== nextProps.currentTutorialStep) {
      this.setState({
        currentlyOpenSectionId: nextProps.currentTutorialStep,
      })
    }
  }

  public render() {
    return (
      <div className="tutorial-panel-component panel">
        <div className="titleArea">
          <h3>开始使用</h3>
          <img src={TutorialPanelImage} alt="部分勾选的检查清单" />
        </div>
        <ol>
          <TutorialStepInstructions
            summaryText="安装文本编辑器"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.PickEditor}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            skipLinkButton={<SkipLinkButton onClick={this.skipEditorInstall} />}
            onSummaryClick={this.onStepSummaryClick}
          >
            {!this.isStepComplete(TutorialStep.PickEditor) ? (
              <>
                <p className="description">
                  看起来您还没有安装文本编辑器。我们可以推荐{' '}
                  <LinkButton
                    uri={suggestedExternalEditor.url}
                    title={`打开 ${suggestedExternalEditor.name} 网站`}
                  >
                    {suggestedExternalEditor.name}
                  </LinkButton>
                  {` 或 `}
                  <LinkButton
                    uri="https://atom.io"
                    title="打开 Atom 网站"
                  >
                    Atom
                  </LinkButton>
                  ，但您也可以自由选择其他编辑器。
                </p>
                <div className="action">
                  <LinkButton onClick={this.skipEditorInstall}>
                    我已经有编辑器
                  </LinkButton>
                </div>
              </>
            ) : (
              <p className="description">
                您的默认编辑器是{' '}
                <strong>{this.props.resolvedExternalEditor}</strong>。您可以在{' '}
                <LinkButton onClick={this.onPreferencesClick}>
                  {__DARWIN__ ? '设置' : '选项'}
                </LinkButton>
              </p>
            )}
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="创建分支"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.CreateBranch}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              {`分支让您可以同时处理仓库的不同版本。通过顶部栏中的分支菜单
                并点击“${__DARWIN__ ? '新建分支' : '新建分支'}”来创建分支。`}
            </p>
            <div className="action">
              <KeyboardShortcut
                darwinKeys={['⌘', '⇧', 'N']}
                keys={['Ctrl', 'Shift', 'N']}
              />
            </div>
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="编辑文件"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.EditFile}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              使用您偏好的文本编辑器打开此仓库。编辑
              {` `}
              <Ref>README.md</Ref>
              {` `}
              文件，保存后返回。
            </p>
            {this.props.resolvedExternalEditor && (
              <div className="action">
                <Button onClick={this.openTutorialFileInEditor}>
                  {__DARWIN__ ? '打开编辑器' : '打开编辑器'}
                </Button>
                <KeyboardShortcut
                  darwinKeys={['⌘', '⇧', 'A']}
                  keys={['Ctrl', 'Shift', 'A']}
                />
              </div>
            )}
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="进行提交"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.MakeCommit}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              提交可以让您保存一组更改。在左下角的“摘要”字段中，编写一段简短的
              说明，描述您所做的更改。完成后，点击蓝色的“提交”按钮即可结束。
            </p>
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="发布到 GitHub"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.PushBranch}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              发布会将您的提交“推送”（即上传）到您在 GitHub 上此仓库的该分支。
              使用顶部栏中的第三个按钮进行发布。
            </p>
            <div className="action">
              <KeyboardShortcut darwinKeys={['⌘', 'P']} keys={['Ctrl', 'P']} />
            </div>
          </TutorialStepInstructions>
          <TutorialStepInstructions
            summaryText="打开拉取请求"
            isComplete={this.isStepComplete}
            isNextStepTodo={this.isStepNextTodo}
            sectionId={TutorialStep.OpenPullRequest}
            currentlyOpenSectionId={this.state.currentlyOpenSectionId}
            skipLinkButton={<SkipLinkButton onClick={this.skipCreatePR} />}
            onSummaryClick={this.onStepSummaryClick}
          >
            <p className="description">
              拉取请求让您可以提议对代码进行更改。
              通过“打开拉取请求”，您是在请求他人审阅并合并这些更改。
              由于这是一个演示仓库，此拉取请求将是私有的。
            </p>
            <div className="action">
              <Button onClick={this.openPullRequest} role="link">
                {__DARWIN__ ? '打开拉取请求' : '打开拉取请求'}
                <Octicon symbol={octicons.linkExternal} />
              </Button>
              <KeyboardShortcut darwinKeys={['⌘', 'R']} keys={['Ctrl', 'R']} />
            </div>
          </TutorialStepInstructions>
        </ol>
        <div className="footer">
          <Button onClick={this.props.onExitTutorial}>
            {__DARWIN__ ? '退出教程' : '退出教程'}
          </Button>
        </div>
      </div>
    )
  }
  /** this makes sure we only have one `TutorialListItem` open at a time */
  public onStepSummaryClick = (id: ValidTutorialStep) => {
    this.setState({ currentlyOpenSectionId: id })
  }

  private onPreferencesClick = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.Preferences,
      initialSelectedTab: PreferencesTab.Integrations,
    })
  }
}

const SkipLinkButton: React.FunctionComponent<{
  onClick: () => void
}> = props => <LinkButton onClick={props.onClick}>跳过</LinkButton>
