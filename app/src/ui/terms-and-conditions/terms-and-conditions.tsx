import * as React from 'react'
import { Dialog, DialogContent, DefaultDialogFooter } from '../dialog'
import { LinkButton } from '../lib/link-button'

interface ITermsAndConditionsProps {
  /** A function called when the dialog is dismissed. */
  readonly onDismissed: () => void
}

const contact = 'https://github.com/contact'
const logos = 'https://github.com/logos'
const privacyStatement =
  'https://help.github.com/articles/github-privacy-statement/'
const license = 'https://creativecommons.org/licenses/by/4.0/'

export class TermsAndConditions extends React.Component<
  ITermsAndConditionsProps,
  {}
> {
  public render() {
    return (
      <Dialog
        id="terms-and-conditions"
        title="GitHub 开源应用程序条款与条件"
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <p>
            本 GitHub 开源应用程序条款与条件（“应用程序条款”）是您（无论以个人身份还是代表某个实体）
            与 GitHub, Inc. 之间就您使用 GitHub 应用程序（例如 GitHub Desktop™ 及相关文档，以下简称“软件”）
            所达成的法律协议。本应用程序条款适用于软件的可执行代码版本。软件的源代码单独提供，并依据开源
            软件许可协议免费提供。如果您不同意本应用程序条款中的全部条款，请勿下载、安装、使用或复制软件。
          </p>

          <h2>连接到 GitHub</h2>

          <p>
            如果您将软件配置为与 GitHub.com 网站上的一个或多个账号，或与 GitHub Enterprise Server 实例配合
            使用，那么您对软件的使用还将受适用于您的 GitHub.com 网站服务条款和/或适用于您的 GitHub Enterprise
            实例的许可协议（“GitHub 条款”）约束。
          </p>

          <p>
            任何违反适用于您的 GitHub 条款的软件使用行为，也将违反本应用程序条款。
          </p>

          <h2>开源许可证和声明</h2>

          <p>
            软件的开源许可证包含在随软件提供的“开源声明”文档中。该文档还包含所有适用开源许可证的副本。
          </p>

          <p>
            在适用于开源组件的许可证条款要求 GitHub 就软件提供源代码要约的范围内，现特此作出该要约，您可以通过
            联系 GitHub 行使该权利：{' '}
            <LinkButton uri={contact}>联系我们</LinkButton>。
          </p>

          <p>
            除非您与 GitHub 另有书面约定，否则您与 GitHub 的协议始终至少包含本应用程序条款。适用于软件源代码的
            开源软件许可证构成单独的书面协议。在开源软件许可证明确取代本应用程序条款的有限范围内，
            开源许可证就您使用软件或软件中特定包含组件的行为约束您与 GitHub 之间的协议。
          </p>

          <h2>GitHub 徽标</h2>

          <p>
            随软件附带的许可授予不适用于 GitHub 的商标，其中包括软件的徽标设计。GitHub 保留对所有 GitHub 商标的
            全部商标权和著作权。例如，GitHub 的徽标包括“logos”文件夹中文件名包含“logo”的那些风格化设计。
          </p>

          <p>
            GitHub、GitHub Desktop、GitHub for Mac、GitHub for Windows、Atom、Octocat 等名称以及相关的 GitHub
            徽标和/或风格化名称均为 GitHub 的商标。您同意不经 GitHub 事先书面许可，不以任何方式展示或使用这些
            商标，但 GitHub 徽标和使用政策允许的情况除外：{' '}
            <LinkButton uri={logos}>徽标</LinkButton>。
          </p>

          <h2>隐私</h2>

          <p>
            软件可能会收集个人信息。您可以在设置面板中控制软件收集哪些信息。如果软件代表 GitHub 收集个人信息，
            GitHub 将按照
            <LinkButton uri={privacyStatement}>
              GitHub 隐私声明
            </LinkButton>
            处理该信息。
          </p>

          <h2>附加服务</h2>

          <h3>自动更新服务</h3>

          <p>
            软件可能包含自动更新服务（“服务”）。如果您选择使用该服务，或您下载的软件会自动启用该服务，
            则 GitHub 将在有新版本可用时自动更新软件。
          </p>

          <h3>免责声明和责任限制</h3>

          <p>
            该服务按“现状”提供，不提供任何明示或默示的保证。您使用该服务的风险完全由您自行承担。GitHub 不保证
            (i) 该服务能满足您的特定需求；(ii) 该服务与任何特定平台完全兼容；(iii) 您对该服务的使用不会中断、
            及时、安全或无错误；(iv) 通过使用该服务获得的结果准确可靠；(v) 您通过该服务购买或获得的任何产品、
            服务、信息或其他材料符合您的期望；或 (vi) 该服务中的任何错误都会得到修正。
          </p>

          <p>
            您明确理解并同意，对于与该服务相关的任何直接、间接、附带、特殊、后果性或惩罚性损害（包括但不限于
            利润损失、商誉损失、使用损失、数据损失或其他无形损失），即使 GitHub 已被告知发生此类损害的可能性，
            GitHub 均不承担责任，包括例如：(i) 使用或无法使用该服务；(ii) 因通过该服务购买、获得、接收消息或
            进行交易而产生的替代商品和服务的采购成本；(iii) 未经授权访问或篡改您的传输内容或数据；
            (iv) 该服务上任何第三方的陈述或行为；或 (v) 与该服务相关的任何其他事项。
          </p>

          <p>
            GitHub 保留随时或不定期地修改或永久/暂时中止该服务（或其任何部分）的权利，无需另行通知。
            对于该服务的任何价格变更、暂停或中止，GitHub 均不对您或任何第三方承担责任。
          </p>

          <h2>其他条款</h2>

          <ol>
            <li>
              不放弃权利。GitHub 未行使或执行本应用程序条款中的任何权利或条款，不构成对该权利或条款的放弃。
            </li>

            <li>
              完整协议。本应用程序条款连同任何适用的隐私声明，构成您与 GitHub 之间的完整协议并约束您对软件的
              使用，取代您与 GitHub 之间的任何先前协议（包括但不限于本应用程序条款的任何先前版本）。
            </li>

            <li>
              适用法律。您同意本应用程序条款以及您对软件的使用受加利福尼亚州法律管辖，与软件相关的任何争议
              必须提交给位于加利福尼亚州旧金山附近且具有管辖权的法院审理。
            </li>

            <li>
              第三方软件包。软件支持第三方“软件包”，这些软件包可能修改、添加、删除或改变软件的功能。这些
              软件包不受本应用程序条款约束，并且可能包含其自己的许可协议，用于约束您对该特定软件包的使用。
            </li>

            <li>
              不得修改；完整协议。本应用程序条款只能通过由 GitHub 授权代表签署的书面修订，或由 GitHub 发布修订
              版本的方式进行修改。本应用程序条款连同任何适用的开源许可证和声明以及 GitHub 隐私声明，构成了
              您与我们之间协议的完整且排他的声明。本应用程序条款取代此前任何口头或书面的提议或协议，以及您与
              GitHub 之间就本条款标的事项进行的任何其他沟通。
            </li>

            <li>
              GitHub 政策的许可。本应用程序条款依据
              <LinkButton uri={license}>
                知识共享署名许可协议
              </LinkButton>
              授权。您可以在知识共享许可协议的条款下自由使用本条款。
            </li>

            <li>
              联系我们。如对本应用程序条款有任何疑问，请发送至{' '}
              <LinkButton uri={contact}>support@github.com</LinkButton>
              。
            </li>
          </ol>
        </DialogContent>

        <DefaultDialogFooter />
      </Dialog>
    )
  }
}
