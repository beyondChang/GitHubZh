import assert from 'node:assert'
import { describe, it } from 'node:test'
import * as React from 'react'
import { CopilotCommitPanel } from '../../../src/ui/changes/copilot-commit-panel'
import { AssistedCommitRunState } from '../../../src/models/assisted-commit-run'
import { ErrorWithMetadata } from '../../../src/lib/error-with-metadata'
import { fireEvent, render, screen } from '../../helpers/ui/render'

describe('Copilot commit run panel', () => {
  for (const [kind, caption] of [
    ['preparing', '正在准备所选更改…'],
    ['capturing', '正在锁定所选更改…'],
    ['analyzing', '正在规划所选更改…'],
    ['summarizing-selection', '正在为所有所选更改编写提交信息…'],
    ['validating', '正在检查完整的提交计划…'],
    ['finishing', '正在刷新本地提交…'],
  ] as const) {
    it(`announces ${kind} and exposes keyboard-reachable Cancel`, async () => {
      let cancelled = 0
      render(
        <CopilotCommitPanel
          filesSelectedCount={2}
          isWorking={true}
          runState={{ kind, runId: 'run', cancelRequested: false }}
          onCancel={() => cancelled++}
        />
      )
      assert.ok(screen.getByText(new RegExp(caption), { selector: '.title' }))
      const button = screen.getByRole('button', { name: '取消' })
      button.focus()
      assert.strictEqual(document.activeElement, button)
      fireEvent.click(button)
      assert.strictEqual(cancelled, 1)
    })
  }

  it('shows real commit index, count and title, not completion inferred from progress', async () => {
    render(
      <CopilotCommitPanel
        filesSelectedCount={2}
        isWorking={true}
        runState={{
          kind: 'committing',
          runId: 'run',
          index: 1,
          total: 3,
          title: 'Exact generated title',
          cancelRequested: false,
        }}
        onCancel={() => {}}
      />
    )
    assert.ok(
      screen.getByText('Creating commit 2 of 3: Exact generated title', {
        selector: '.title',
      })
    )
    assert.ok(screen.getByText('Exact generated title'))
    assert.ok(screen.getByRole('button', { name: '取消' }))
    assert.strictEqual(screen.queryByText(/Committed/), null)
  })

  it('shows cancellation without hiding Cancel, and disables it only through verified rollback', async () => {
    const view = render(
      <CopilotCommitPanel
        filesSelectedCount={1}
        isWorking={true}
        runState={{ kind: 'analyzing', runId: 'run', cancelRequested: true }}
        onCancel={() => {}}
      />
    )
    assert.ok(
      screen.getByText('正在取消本次提交运行…', { selector: '.title' })
    )
    assert.notStrictEqual(
      screen
        .getByRole('button', { name: '取消' })
        .getAttribute('aria-disabled'),
      'true'
    )
    view.rerender(
      <CopilotCommitPanel
        filesSelectedCount={1}
        isWorking={true}
        runState={{ kind: 'rolling-back', runId: 'run' }}
        onCancel={() => {}}
      />
    )
    assert.ok(
      screen.getByText('正在撤销本次运行创建的提交…', { selector: '.title' })
    )
    assert.strictEqual(
      screen
        .getByRole('button', { name: '取消' })
        .getAttribute('aria-disabled'),
      'true'
    )
  })

  it('keeps recovery errors explicit with retry/details, never a dismiss-to-ready escape', async () => {
    const state: AssistedCommitRunState = {
      kind: 'error',
      runId: 'run',
      retry: 'recovery',
      selectionNeedsReview: true,
      settling: false,
      error: new ErrorWithMetadata(new Error('External HEAD changed'), {}),
    }
    let retry = 0
    let details = 0
    const view = render(
      <CopilotCommitPanel
        filesSelectedCount={1}
        isWorking={false}
        runState={state}
        onRetryRecovery={() => retry++}
        onErrorDetails={() => details++}
        onDismissError={() => {}}
      />
    )
    assert.ok(screen.getByRole('alert'))
    assert.strictEqual(screen.queryByText('External HEAD changed'), null)
    assert.ok(screen.getByText(/部分已选更改发生移动或变更/))
    assert.strictEqual(screen.queryByRole('button', { name: '忽略' }), null)
    assert.strictEqual(
      view.container.querySelector('.copilot-commit-panel.working'),
      null
    )
    fireEvent.click(screen.getByRole('button', { name: '重试回滚' }))
    fireEvent.click(screen.getByRole('button', { name: '详细信息' }))
    assert.strictEqual(retry, 1)
    assert.strictEqual(details, 1)
  })

  it('updates the actual live region for each phase and commit while remaining busy', async () => {
    const view = render(
      <CopilotCommitPanel
        filesSelectedCount={1}
        isWorking={true}
        runState={{ kind: 'analyzing', runId: 'run', cancelRequested: false }}
      />
    )
    const live = () =>
      view.container.querySelector('[aria-live="polite"]')?.textContent
    assert.match(live() ?? '', /正在规划所选更改/)
    view.rerender(
      <CopilotCommitPanel
        filesSelectedCount={1}
        isWorking={true}
        runState={{
          kind: 'committing',
          runId: 'run',
          index: 0,
          total: 2,
          title: 'Focused title',
          cancelRequested: false,
        }}
      />
    )
    assert.match(live() ?? '', /Creating commit 1 of 2: Focused title/)
    view.rerender(
      <CopilotCommitPanel
        filesSelectedCount={1}
        isWorking={true}
        runState={{ kind: 'rolling-back', runId: 'run' }}
      />
    )
    assert.match(live() ?? '', /正在撤销本次运行创建的提交/)
  })

  for (const retry of [null, 'recovery', 'refresh'] as const) {
    for (const settling of [false, true]) {
      it(`announces error/${retry} only through its alert while settling=${settling}`, async () => {
        const view = render(
          <CopilotCommitPanel
            filesSelectedCount={1}
            isWorking={true}
            runState={{
              kind: 'analyzing',
              runId: 'run',
              cancelRequested: false,
            }}
          />
        )
        const live = view.container.querySelector('[aria-live="polite"]')
        assert.ok(live)
        assert.match(live.textContent ?? '', /正在规划所选更改/)
        view.rerender(
          <CopilotCommitPanel
            filesSelectedCount={1}
            isWorking={settling}
            runState={{
              kind: 'error',
              runId: 'run',
              retry,
              settling,
              selectionNeedsReview: true,
              error: new ErrorWithMetadata(
                new Error('Current failure details'),
                {}
              ),
            }}
            onRetryRecovery={() => {}}
            onDismissError={() => {}}
          />
        )
        assert.strictEqual(screen.getAllByRole('alert').length, 1)
        assert.match(
          screen.getByRole('alert').textContent ?? '',
          /Commit run stopped/
        )
        assert.strictEqual(live.textContent, '')
      })
    }
  }

  it('keeps cancellation, rollback, refresh and finalization progress in the polite live region', async () => {
    for (const state of [
      { kind: 'analyzing', runId: 'run', cancelRequested: true },
      { kind: 'rolling-back', runId: 'run' },
      { kind: 'refreshing', runId: 'run' },
      { kind: 'closing', runId: 'run' },
    ] as const) {
      const view = render(
        <CopilotCommitPanel
          filesSelectedCount={1}
          isWorking={true}
          runState={state}
        />
      )
      const title = view.container.querySelector('.caption .title')
      const live = view.container.querySelector('[aria-live="polite"]')
      assert.ok(title && live)
      assert.notStrictEqual(live.textContent, '')
      assert.strictEqual(live.textContent, title.textContent)
      assert.strictEqual(screen.queryByRole('alert'), null)
      view.unmount()
    }
  })

  for (const retry of [null, 'recovery', 'refresh'] as const) {
    it(`keeps ${
      retry === null ? 'Dismiss' : 'Retry'
    } disabled while error ownership is settling`, async () => {
      let acted = 0
      const state: AssistedCommitRunState = {
        kind: 'error',
        runId: 'run',
        error: new ErrorWithMetadata(new Error('Run stopped'), {}),
        retry,
        settling: true,
        selectionNeedsReview: false,
      }
      render(
        <CopilotCommitPanel
          filesSelectedCount={1}
          isWorking={true}
          runState={state}
          onRetryRecovery={() => acted++}
          onDismissError={() => acted++}
        />
      )
      const button = screen.getByRole('button', {
        name:
          retry === null
            ? '忽略'
            : retry === 'recovery'
            ? '重试回滚'
            : '重试刷新',
      })
      assert.strictEqual(button.getAttribute('aria-disabled'), 'true')
      fireEvent.click(button)
      assert.strictEqual(acted, 0)
      assert.ok(screen.getByText('正在完成仓库刷新…'))
    })
  }

  it('returns to idle after remount without retaining old progress or exposing decorative animation to AT', async () => {
    const initial = render(
      <CopilotCommitPanel
        filesSelectedCount={1}
        isWorking={true}
        runState={{ kind: 'analyzing', runId: 'run', cancelRequested: false }}
        onCancel={() => {}}
      />
    )
    initial.unmount()
    const view = render(
      <CopilotCommitPanel
        filesSelectedCount={0}
        isWorking={false}
        allowEmptyCommit={true}
        runState={{ kind: 'idle' }}
      />
    )
    assert.ok(screen.getByText('创建空提交'))
    assert.strictEqual(screen.queryByRole('button', { name: '取消' }), null)
    assert.strictEqual(
      view.container
        .querySelector('.copilot-animation')
        ?.getAttribute('aria-hidden'),
      'true'
    )
    assert.ok(screen.getByRole('button', { name: '让 Copilot 做出反应' }))
  })
})
