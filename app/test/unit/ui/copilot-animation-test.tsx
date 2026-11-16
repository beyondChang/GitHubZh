import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import * as React from 'react'

import { CopilotAnimation } from '../../../src/ui/copilot-animation/copilot-animation'
import { CopilotCommitPanel } from '../../../src/ui/changes/copilot-commit-panel'
import { fireEvent, render, screen } from '../../helpers/ui/render'
import {
  advanceTimersBy,
  enableTestTimers,
  resetTestTimers,
} from '../../helpers/ui/timers'

/**
 * Advance the timers one phase at a time, since timers scheduled while
 * advancing the clock won't fire until the next advance.
 */
function advanceThroughPhases(...durations: ReadonlyArray<number>) {
  for (const duration of durations) {
    advanceTimersBy(duration)
  }
}

function getAnimationState(container: HTMLElement) {
  return container
    .querySelector('.copilot-sprite')
    ?.getAttribute('data-animation-state')
}

describe('CopilotAnimation', () => {
  beforeEach(() => enableTestTimers(['setTimeout', 'Date']))
  afterEach(() => resetTestTimers())

  it('plays a one-shot animation and notifies when it ends', () => {
    let ended = 0
    const view = render(
      <CopilotAnimation
        animation="tickle"
        loop={false}
        onAnimationEnd={() => ended++}
      />
    )

    assert.equal(getAnimationState(view.container), 'idle')

    advanceTimersBy(33)
    assert.equal(getAnimationState(view.container), 'running')
    assert.equal(ended, 0)

    advanceTimersBy(1188)
    assert.equal(getAnimationState(view.container), 'idle')
    assert.equal(ended, 1)

    // One-shot animations don't restart on their own
    advanceTimersBy(5000)
    assert.equal(ended, 1)
  })

  it('finishes the current cycle of a looping animation when it stops looping', () => {
    let ended = 0
    const view = render(
      <CopilotAnimation
        animation="thinking"
        loop={true}
        onAnimationEnd={() => ended++}
      />
    )

    advanceTimersBy(33)
    assert.equal(getAnimationState(view.container), 'starting')
    advanceTimersBy(429)
    assert.equal(getAnimationState(view.container), 'running')

    advanceTimersBy(10_000)
    assert.equal(getAnimationState(view.container), 'running')

    view.rerender(
      <CopilotAnimation
        animation="thinking"
        loop={false}
        onAnimationEnd={() => ended++}
      />
    )

    advanceTimersBy(1390)
    assert.equal(getAnimationState(view.container), 'ending')
    assert.equal(ended, 0)

    advanceTimersBy(429)
    assert.equal(getAnimationState(view.container), 'idle')
    assert.equal(ended, 1)
  })

  it('restarts when the animation changes', () => {
    const view = render(<CopilotAnimation animation="tickle" loop={false} />)

    advanceThroughPhases(33, 1188)
    assert.equal(getAnimationState(view.container), 'idle')

    view.rerender(<CopilotAnimation animation="jump-wiggle" loop={false} />)
    assert.ok(view.container.querySelector('.copilot-sprite-jump-wiggle'))

    advanceTimersBy(33)
    assert.equal(getAnimationState(view.container), 'running')
  })

  it('is hidden from assistive technologies', () => {
    const view = render(<CopilotAnimation animation="idle" loop={true} />)
    const holder = view.container.querySelector('.copilot-animation')
    assert.equal(holder?.getAttribute('aria-hidden'), 'true')
  })
})

describe('CopilotCommitPanel', () => {
  beforeEach(() => enableTestTimers(['setTimeout', 'Date']))
  afterEach(() => resetTestTimers())

  it('asks the user to select changes when none are selected', () => {
    render(<CopilotCommitPanel filesSelectedCount={0} isWorking={false} />)

    assert.ok(screen.getByText(/选择您想要提交的更改/))
  })

  it('renders optional controls inside the panel without changing its caption', () => {
    const view = render(
      <CopilotCommitPanel filesSelectedCount={1} isWorking={false}>
        <button>Configure options</button>
      </CopilotCommitPanel>
    )
    const panel = view.container.querySelector('.copilot-commit-panel')
    assert.ok(panel)
    assert.ok(panel.classList.contains('with-options'))
    assert.ok(
      panel.contains(screen.getByRole('button', { name: 'Configure options' }))
    )
    assert.ok(screen.getByText('让 Copilot 帮您编写提交'))
    view.rerender(
      <CopilotCommitPanel filesSelectedCount={1} isWorking={false} />
    )
    assert.strictEqual(panel.classList.contains('with-options'), false)
    assert.strictEqual(
      screen.queryByRole('button', { name: 'Configure options' }),
      null
    )
  })

  it('describes what Copilot will do with the selected files', () => {
    const view = render(
      <CopilotCommitPanel filesSelectedCount={3} isWorking={false} />
    )

    assert.ok(screen.getByText(/把选中的 3 个文件拆分为提交/))

    view.rerender(
      <CopilotCommitPanel filesSelectedCount={1} isWorking={false} />
    )
    assert.ok(screen.getByText(/把选中的 1 个文件拆分为提交/))
  })

  it('describes an empty commit without claiming to analyze nonexistent changes', () => {
    render(
      <CopilotCommitPanel
        filesSelectedCount={0}
        isWorking={false}
        allowEmptyCommit={true}
      />
    )
    assert.ok(screen.getByText('创建空提交'))
    assert.ok(screen.getByText(/不含文件更改或 Copilot 分析/))
    assert.strictEqual(screen.queryByText(/选择您想要提交的更改/), null)
  })

  it('celebrates its entrance and then idles', () => {
    const view = render(
      <CopilotCommitPanel filesSelectedCount={1} isWorking={false} />
    )

    assert.ok(view.container.querySelector('.copilot-sprite-celebrate'))

    advanceThroughPhases(33, 1056)
    assert.ok(view.container.querySelector('.copilot-sprite-idle'))
  })

  it('exposes a named native mascot button while hiding decorative elements', () => {
    const view = render(
      <CopilotCommitPanel filesSelectedCount={1} isWorking={false} />
    )
    const button = screen.getByRole('button', { name: '让 Copilot 做出反应' })
    assert.ok(button instanceof HTMLButtonElement)
    assert.strictEqual(button.type, 'button')
    assert.strictEqual(button.tabIndex, 0)
    button.focus()
    assert.strictEqual(document.activeElement, button)
    for (const selector of [
      '.copilot-animation',
      '.sparkles',
      '.copilot-shadow',
    ]) {
      assert.strictEqual(
        view.container.querySelector(selector)?.getAttribute('aria-hidden'),
        'true'
      )
    }
  })

  it('jumps on activation and celebrates after five rapid activations', () => {
    const view = render(
      <CopilotCommitPanel filesSelectedCount={1} isWorking={false} />
    )
    const button = screen.getByRole('button', { name: '让 Copilot 做出反应' })
    advanceThroughPhases(33, 1056)
    const sparkles = view.container.querySelector('.sparkles')

    fireEvent.click(button)
    assert.ok(view.container.querySelector('.copilot-sprite-jump-wiggle'))
    for (let i = 0; i < 3; i++) {
      fireEvent.click(button)
    }
    assert.ok(view.container.querySelector('.copilot-sprite-jump-wiggle'))
    fireEvent.click(button)
    assert.ok(view.container.querySelector('.copilot-sprite-celebrate'))
    assert.notStrictEqual(view.container.querySelector('.sparkles'), sparkles)
    assert.strictEqual(
      view.container.querySelector('[aria-live="polite"]')?.textContent,
      ''
    )
  })

  it('keeps focus but disables mascot reactions until thinking finishes', () => {
    const view = render(
      <CopilotCommitPanel filesSelectedCount={1} isWorking={false} />
    )
    const button = screen.getByRole('button', { name: '让 Copilot 做出反应' })
    button.focus()
    view.rerender(
      <CopilotCommitPanel filesSelectedCount={1} isWorking={true} />
    )
    assert.strictEqual(button.getAttribute('aria-disabled'), 'true')
    assert.strictEqual(document.activeElement, button)
    const sparkles = view.container.querySelector('.sparkles')
    for (let i = 0; i < 5; i++) {
      fireEvent.click(button)
    }
    assert.ok(view.container.querySelector('.copilot-sprite-thinking'))
    assert.strictEqual(view.container.querySelector('.sparkles'), sparkles)

    view.rerender(
      <CopilotCommitPanel filesSelectedCount={1} isWorking={false} />
    )
    assert.strictEqual(button.getAttribute('aria-disabled'), 'true')
    advanceThroughPhases(33, 429, 1390, 429)
    assert.strictEqual(button.getAttribute('aria-disabled'), 'false')
    fireEvent.click(button)
    assert.ok(view.container.querySelector('.copilot-sprite-jump-wiggle'))
  })

  it('thinks while Copilot is working', () => {
    const view = render(
      <CopilotCommitPanel filesSelectedCount={1} isWorking={false} />
    )

    view.rerender(
      <CopilotCommitPanel filesSelectedCount={1} isWorking={true} />
    )

    const panel = view.container.querySelector('.copilot-commit-panel')
    assert.ok(panel?.classList.contains('working'))
    assert.ok(view.container.querySelector('.copilot-sprite-thinking'))
    assert.ok(screen.getByText('Copilot 正在处理…'))

    view.rerender(
      <CopilotCommitPanel filesSelectedCount={1} isWorking={false} />
    )

    // The thinking animation winds down before going back to idle
    assert.ok(view.container.querySelector('.copilot-sprite-thinking'))
    advanceThroughPhases(33, 429, 1390, 429)
    assert.ok(view.container.querySelector('.copilot-sprite-idle'))
  })
})
