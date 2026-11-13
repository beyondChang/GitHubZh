import * as React from 'react'
import { getHTMLURL } from '../../lib/api'
import { Ref } from './ref'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'

interface IEnterpriseServerConfirmationProps {
  readonly endpoint: string
}

export const enterpriseServerConfirmationDescriptionId =
  'enterprise-server-confirmation-description'

/** Explains the destination of an Enterprise sign-in requested by Git. */
export class EnterpriseServerConfirmation extends React.Component<IEnterpriseServerConfirmationProps> {
  public render() {
    return (
      <div
        id={enterpriseServerConfirmationDescriptionId}
        className="enterprise-server-confirmation"
      >
        <p>Git 正在请求登录此服务器：</p>
        <p>
          <Ref>{getHTMLURL(this.props.endpoint)}</Ref>
        </p>
        <div className="enterprise-server-warning">
          <Octicon symbol={octicons.alert} />
          <p>
            <strong>
              仅当您认识并信任此服务器时才继续登录。
            </strong>{' '}
            请确认此地址显示在您的浏览器中。否则，请取消并与您的仓库管理员联系。
          </p>
        </div>
      </div>
    )
  }
}
