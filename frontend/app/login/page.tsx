'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/axios'

type LoginResponse = {
  ok: boolean
  user: { id: number; username: string; nombre: string; rol: string }
}

export default function LoginPage() {
  const { login } = useAuth()
  const { toast }  = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    if (!username || !password) {
      toast({ variant: 'destructive', title: 'Completa todos los campos' })
      return
    }

    setLoading(true)
    try {
      const data = await api.post('/auth/login', { username, password }) as unknown as LoginResponse
      login(data.user)
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error al iniciar sesión',
        description: err?.message || 'Credenciales inválidas',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 border rounded-xl shadow-sm bg-card">

        <div className="space-y-3 text-center">
          <Image src="/logo.png" alt="FinApp" width={80} height={80} className="mx-auto h-20 w-20 object-contain" priority />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">FinApp</h1>
            <p className="text-sm text-muted-foreground">Inicia sesión para continuar</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              placeholder="usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              disabled={loading}
            />
          </div>

          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </div>

      </div>
    </div>
  )
}