import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginForm from './LoginForm'

const mockSignIn = vi.fn()
const mockSignUp = vi.fn()
const mockResetPassword = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPassword(...args),
    },
  },
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    render(<LoginForm onLogin={vi.fn()} />)
    expect(screen.getByText(/Bem-Vindo ao PontoGO/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/seu@email\.com/i)).toBeInTheDocument()
  })

  it('switches to cadastro mode', () => {
    render(<LoginForm onLogin={vi.fn()} />)
    fireEvent.click(screen.getByText(/Não tem conta\? Cadastre-se/i))
    expect(screen.getByText(/Criar conta/i)).toBeInTheDocument()
  })

  it('validates password strength on signup', async () => {
    render(<LoginForm onLogin={vi.fn()} />)
    fireEvent.click(screen.getByText(/Não tem conta\? Cadastre-se/i))

    const emailInput = screen.getByPlaceholderText(/seu@email\.com/i)
    const passwordInput = screen.getByPlaceholderText(/••••••••/i)

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'weak' } })
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/i }))

    await waitFor(() => {
      expect(screen.getByText(/A senha deve ter pelo menos 8 caracteres/i)).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('rate limits after 5 attempts', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'))
    render(<LoginForm onLogin={vi.fn()} />)

    const emailInput = screen.getByPlaceholderText(/seu@email\.com/i)
    const passwordInput = screen.getByPlaceholderText(/••••••••/i)
    const submitBtn = screen.getByRole('button', { name: /Entrar/i })

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'Password1' } })

    for (let i = 0; i < 5; i++) {
      fireEvent.click(submitBtn)
      await waitFor(() => expect(screen.getByRole('button', { name: /Entrar/i })).not.toBeDisabled())
    }

    expect(mockSignIn).toHaveBeenCalledTimes(5)

    fireEvent.click(submitBtn)
    const rateLimitMsg = await screen.findByText(/Muitas tentativas\. Aguarde 1 minuto/i)
    expect(rateLimitMsg).toBeInTheDocument()
    expect(mockSignIn).toHaveBeenCalledTimes(5)
  })

  it('calls onLogin after successful sign in', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    const onLogin = vi.fn()
    render(<LoginForm onLogin={onLogin} />)

    fireEvent.change(screen.getByPlaceholderText(/seu@email\.com/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'Password1' } })
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }))

    await waitFor(() => expect(onLogin).toHaveBeenCalled())
  })
})
