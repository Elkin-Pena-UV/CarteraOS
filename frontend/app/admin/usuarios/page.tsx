'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import {
  useUsuarios,
  useCrearUsuario,
  useActualizarUsuario,
  useResetPassword,
} from '@/hooks/use-users'
import type { Usuario } from '@/lib/services/userService'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus, Pencil, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/contexts/AuthContext'

// ─── tipos ────────────────────────────────────────────────────────────────
type ModalMode = 'crear' | 'editar' | 'password' | null

interface FormState {
  username: string
  nombre: string
  password: string
  rol: string
  activo: boolean
}

const EMPTY_FORM: FormState = {
  username: '',
  nombre: '',
  password: '',
  rol: 'auxiliar_contable',
  activo: true,
}

const ROL_LABELS: Record<string, string> = {
  admin:              'Administrador',
  auxiliar_contable:  'Aux. Gestión Contable',
  analista_tesoreria: 'Analista de Tesorería',
  jefe_tesoreria:     'Jefe de Tesorería y Cartera',
}

const ROL_COLORS: Record<string, string> = {
  admin:              'bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/30',
  auxiliar_contable:  'bg-[#00359a]/10 text-[#00359a] border-[#00359a]/30',
  analista_tesoreria: 'bg-purple-50 text-purple-700 border-purple-200',
  jefe_tesoreria:     'bg-emerald-50 text-emerald-700 border-emerald-200',
}

// ─── utilidades ──────────────────────────────────────────────────────────
function generarUsername(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  if (partes.length < 2) return ''
  const inicial = partes[0][0]
  const apellido = partes[1]
  return (inicial + apellido)
    .toLowerCase()
    .normalize('NFD')                  // descompone á → a + ´
    .replace(/[\u0300-\u036f]/g, '')   // elimina los diacríticos
}

function formatFecha(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Bogota',
  })
}

// ─── componente principal ─────────────────────────────────────────────────
export default function UsuariosPage() {
  const { user: me } = useAuth()
  const { usuarios, isLoading } = useUsuarios()
  const crearMutation    = useCrearUsuario()
  const editarMutation   = useActualizarUsuario()
  const passwordMutation = useResetPassword()

  const [mode, setMode]                   = useState<ModalMode>(null)
  const [selected, setSelected]           = useState<Usuario | null>(null)
  const [form, setForm]                   = useState<FormState>(EMPTY_FORM)
  const [showPassword, setShowPassword]   = useState(false)
  const [usernameEditado, setUsernameEditado] = useState(false)

  const isBusy =
    crearMutation.isPending ||
    editarMutation.isPending ||
    passwordMutation.isPending

  // ── autocompletar username desde nombre ──────────────────────────────────
  useEffect(() => {
    if (mode !== 'crear' || usernameEditado) return
    setForm(prev => ({ ...prev, username: generarUsername(prev.nombre) }))
  }, [form.nombre])

  // ── abrir modales ────────────────────────────────────────────────────────
  const openCrear = () => {
    setForm(EMPTY_FORM)
    setSelected(null)
    setShowPassword(false)
    setUsernameEditado(false)
    setMode('crear')
  }

  const openEditar = (u: Usuario) => {
    setForm({ username: u.username, nombre: u.nombre, password: '', rol: u.rol, activo: u.activo })
    setSelected(u)
    setMode('editar')
  }

  const openPassword = (u: Usuario) => {
    setForm({ ...EMPTY_FORM, password: '' })
    setSelected(u)
    setShowPassword(false)
    setMode('password')
  }

  const closeModal = () => { setMode(null); setSelected(null) }

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (mode === 'crear') {
      try {
        await crearMutation.mutateAsync({
          username: form.username,
          nombre:   form.nombre,
          password: form.password,
          rol:      form.rol,
        })
        closeModal()
      } catch (err: any) {
        // Si el username ya existe, sugerir sufijo numérico automáticamente
        if (err?.message?.includes('ya está en uso')) {
          const base    = form.username.replace(/\d+$/, '')
          const sufijo  = parseInt(form.username.match(/\d+$/)?.[0] ?? '1')
          const siguiente = isNaN(sufijo) ? `${base}2` : `${base}${sufijo + 1}`
          setForm(prev => ({ ...prev, username: siguiente }))
          setUsernameEditado(true)
        }
      }
      return
    }

    if (mode === 'editar' && selected) {
      await editarMutation.mutateAsync({
        id:  selected.id,
        dto: { nombre: form.nombre, rol: form.rol, activo: form.activo },
      })
      closeModal()
      return
    }

    if (mode === 'password' && selected) {
      await passwordMutation.mutateAsync({ id: selected.id, password: form.password })
      closeModal()
    }
  }

  const field = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  // ── guard de rol ─────────────────────────────────────────────────────────
  if (me?.rol !== 'admin') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
          <ShieldCheck className="size-10" />
          <p>Acceso restringido a administradores.</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">

        {/* ── cabecera ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Gestión de usuarios</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Administra las cuentas con acceso a CarteraOS
            </p>
          </div>
          <Button onClick={openCrear} className="bg-[#ff6600] hover:bg-[#e55a00] text-white gap-2">
            <Plus className="size-4" />
            Nuevo usuario
          </Button>
        </div>

        {/* ── tabla ── */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium">Rol</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Último acceso</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{u.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.username}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${ROL_COLORS[u.rol] ?? ''}`}>
                        {ROL_LABELS[u.rol] ?? u.rol}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={u.activo
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-600 border-red-200'}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatFecha(u.last_login)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="icon" className="size-8"
                          onClick={() => openEditar(u)}
                          title="Editar"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="size-8"
                          onClick={() => openPassword(u)}
                          title="Resetear contraseña"
                        >
                          <KeyRound className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── modal crear / editar ── */}
      <Dialog open={mode === 'crear' || mode === 'editar'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === 'crear' ? 'Nuevo usuario' : `Editar — ${selected?.username}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">

            {/* nombre — siempre primero para que dispare el autocompletado */}
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                placeholder="ej: Juan Pérez"
                value={form.nombre}
                onChange={field('nombre')}
              />
            </div>

            {/* username solo en creación */}
            {mode === 'crear' && (
              <div className="space-y-1.5">
                <Label htmlFor="username">
                  Nombre de usuario
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                    (autocompletado)
                  </span>
                </Label>
                <Input
                  id="username"
                  placeholder="ej: jperes"
                  value={form.username}
                  onChange={(e) => {
                    setUsernameEditado(true)
                    field('username')(e)
                  }}
                  autoComplete="off"
                  className="font-mono"
                />
              </div>
            )}

            {/* contraseña solo en creación */}
            {mode === 'crear' && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña inicial</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={field('password')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* rol */}
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={form.rol} onValueChange={(v) => setForm(p => ({ ...p, rol: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="auxiliar_contable">Aux. Gestión Contable</SelectItem>
                  <SelectItem value="analista_tesoreria">Analista de Tesorería</SelectItem>
                  <SelectItem value="jefe_tesoreria">Jefe de Tesorería y Cartera</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* estado — solo en edición */}
            {mode === 'editar' && (
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Estado de la cuenta</p>
                  <p className="text-xs text-muted-foreground">
                    {form.activo ? 'El usuario puede iniciar sesión' : 'Acceso bloqueado'}
                  </p>
                </div>
                <Switch
                  checked={form.activo}
                  onCheckedChange={(v) => setForm(p => ({ ...p, activo: v }))}
                  disabled={selected?.id === me?.id}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={isBusy}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isBusy}
              className="bg-[#ff6600] hover:bg-[#e55a00] text-white"
            >
              {isBusy && <Loader2 className="size-4 mr-2 animate-spin" />}
              {mode === 'crear' ? 'Crear usuario' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── modal resetear contraseña ── */}
      <Dialog open={mode === 'password'} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Resetear contraseña</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Establece una nueva contraseña para <strong>{selected?.nombre}</strong>.
          </p>
          <div className="space-y-1.5 py-1">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={field('password')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={isBusy}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isBusy || form.password.length < 6}
              className="bg-[#ff6600] hover:bg-[#e55a00] text-white"
            >
              {isBusy && <Loader2 className="size-4 mr-2 animate-spin" />}
              Actualizar contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
