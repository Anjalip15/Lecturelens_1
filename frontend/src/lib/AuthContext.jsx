import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  const email = session?.user?.email ?? ''
  const username =
    session?.user?.user_metadata?.username ||
    (email ? email.split('@')[0] : 'Student')

  const signUp = async (email, password, chosenUsername) => {
    const name = (chosenUsername || '').trim() || email.split('@')[0]
    const res = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: name } },
    })
    if (res.data?.user && !res.error) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: res.data.user.id, username: name }, { onConflict: 'id' })
      if (error) console.error('Failed to create profile row:', error)
    }
    return res
  }

  const signIn = async (email, password) => {
    const res = await supabase.auth.signInWithPassword({ email, password })
    if (res.data?.user) {
      const name = res.data.user.user_metadata?.username || email.split('@')[0]
      // ignoreDuplicates: create the profile only if missing, never overwrite
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: res.data.user.id, username: name }, { onConflict: 'id', ignoreDuplicates: true })
      if (error) console.error('Failed to create profile row:', error)
    }
    return res
  }

  const signOut = () => supabase.auth.signOut()

  // Optional: lets you build a "change username" form later
  const updateUsername = async (newName) => {
    const name = newName.trim()
    const { error } = await supabase.auth.updateUser({ data: { username: name } })
    if (error) return { error }
    if (session?.user) {
      await supabase.from('profiles').update({ username: name }).eq('id', session.user.id)
    }
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ session, username, signUp, signIn, signOut, updateUsername }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}