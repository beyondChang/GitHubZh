import { shell } from '../../lib/app-shell'
import { Dispatcher } from '../dispatcher'

export async function openFile(
  fullPath: string,
  dispatcher: Dispatcher
): Promise<void> {
  const errorMessage = await shell.openPath(fullPath)

  if (errorMessage !== '') {
    const error = {
      name: 'no-external-program',
      message: `无法在外部程序中打开文件 ${fullPath}。请检查您是否有与该文件扩展名关联的程序`,
    }
    await dispatcher.postError(error)
  }
}
