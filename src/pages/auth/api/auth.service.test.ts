import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FirebaseError } from 'firebase/app'

const authMocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  deleteUser: vi.fn(),
  linkWithCredential: vi.fn(),
  reauthenticateWithCredential: vi.fn(),
  getRedirectResult: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
}))

const apiMocks = vi.hoisted(() => ({
  post: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  ...authMocks,
  EmailAuthProvider: { credential: vi.fn() },
  GoogleAuthProvider: class {
    setCustomParameters = vi.fn()
  },
}))

vi.mock('@/config/api-client', () => ({
  default: apiMocks,
}))

vi.mock('@/config/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({})),
}))

import { logout, registerWithEmail, signInWithEmail } from './auth.service'

const storage = new Map<string, string>()

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
})

vi.stubGlobal('sessionStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
})

beforeEach(() => {
  vi.clearAllMocks()
  storage.clear()
})

describe('registerWithEmail', () => {

  it('returns the existing-email error without attempting a password login', async () => {
    const emailExistsError = new FirebaseError('auth/email-already-in-use', 'Email already exists')
    authMocks.createUserWithEmailAndPassword.mockRejectedValue(emailExistsError)

    await expect(registerWithEmail('User', 'user@example.com', 'password123')).rejects.toBe(emailExistsError)
    expect(authMocks.signInWithEmailAndPassword).not.toHaveBeenCalled()
  })

  it('does not store a partial session when backend verification fails', async () => {
    const credential = { user: { getIdToken: vi.fn().mockResolvedValue('token') } }
    authMocks.signInWithEmailAndPassword.mockResolvedValue(credential)
    apiMocks.post.mockRejectedValue(new Error('Backend unavailable'))

    await expect(signInWithEmail('user@example.com', 'password123')).rejects.toThrow('Backend unavailable')
    expect(localStorage.getItem('happify.idToken')).toBeNull()
  })
})

describe('logout', () => {
  it('signs out from Firebase and clears the application session', async () => {
    storage.set('happify.idToken', 'token')
    storage.set('happify.userId', 'user-id')
    storage.set('happify.role', 'USER')

    await logout()

    expect(authMocks.signOut).toHaveBeenCalledOnce()
    expect(storage.size).toBe(0)
  })
})
