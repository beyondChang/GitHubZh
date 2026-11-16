import * as React from 'react'

import { encodePathAsUrl } from '../../lib/path'

const CodeImage = encodePathAsUrl(__dirname, 'static/code.svg')
const TeamDiscussionImage = encodePathAsUrl(
  __dirname,
  'static/github-for-teams.svg'
)
const CloudServerImage = encodePathAsUrl(
  __dirname,
  'static/github-for-business.svg'
)

export class TutorialWelcome extends React.Component {
  public render() {
    return (
      <div id="tutorial-welcome">
        <div className="header">
          <h1>欢迎使用 GitHub Desktop</h1>
          <p>
            通过本教程熟悉 Git、GitHub 和 GitHub Desktop。
          </p>
        </div>
        <ul className="definitions">
          <li>
            <img src={CodeImage} alt="HTML 语法图标" />
            <p>
              <strong>Git</strong> 是版本控制系统。
            </p>
          </li>
          <li>
            <img
              src={TeamDiscussionImage}
              alt="头顶带有对话气泡的人们"
            />
            <p>
              <strong>GitHub</strong> 是您存储代码并
              与他人协作的地方。
            </p>
          </li>
          <li>
            <img src={CloudServerImage} alt="带有云端的服务器堆栈" />
            <p>
              <strong>GitHub Desktop</strong> 帮助您在本地使用
              GitHub。
            </p>
          </li>
        </ul>
      </div>
    )
  }
}
