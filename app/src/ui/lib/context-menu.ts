const RestrictedFileExtensions = ['.cmd', '.exe', '.bat', '.sh']
export const CopyFilePathLabel = '复制文件路径'

export const CopyRelativeFilePathLabel = '复制相对文件路径'

export const CopySelectedPathsLabel = '复制路径'

export const CopySelectedRelativePathsLabel = '复制相对路径'

export const DefaultEditorLabel = '在外部编辑器中打开'

export const DefaultShellLabel = '在终端中打开'

export const RevealInFileManagerLabel = __DARWIN__
  ? '在访达中显示'
  : __WIN32__
  ? '在资源管理器中显示'
  : '在文件管理器中显示'

export const TrashNameLabel = __WIN32__ ? '回收站' : '废纸篓'

export const OpenWithDefaultProgramLabel = '用默认程序打开'

export function isSafeFileExtension(extension: string): boolean {
  if (__WIN32__) {
    return RestrictedFileExtensions.indexOf(extension.toLowerCase()) === -1
  }
  return true
}
