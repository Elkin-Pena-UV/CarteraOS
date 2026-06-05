import api from '@/lib/axios'

export interface Usuario {
  id: number
  username: string
  nombre: string
  rol: string
  activo: boolean
  last_login: string | null
}

export interface CreateUsuarioDto {
  username: string
  nombre: string
  password: string
  rol: string
}

export interface UpdateUsuarioDto {
  nombre: string
  rol: string
  activo: boolean
}

export const userService = {
  listar: (): Promise<{ ok: boolean; total: number; data: Usuario[] }> =>
    api.get('/admin/usuarios'),

  crear: (dto: CreateUsuarioDto): Promise<{ ok: boolean; data: Usuario }> =>
    api.post('/admin/usuarios', dto),

  actualizar: (id: number, dto: UpdateUsuarioDto): Promise<{ ok: boolean; data: Usuario }> =>
    api.patch(`/admin/usuarios/${id}`, dto),

  resetPassword: (id: number, password: string): Promise<{ ok: boolean; message: string }> =>
    api.patch(`/admin/usuarios/${id}/password`, { password }),
}