import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the SkillBridge scaffold landing screen', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /skillbridge attendance/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/monitoring officer/i)).toBeInTheDocument()
    expect(screen.getByText(/ai-first enhancement/i)).toBeInTheDocument()
  })
})
