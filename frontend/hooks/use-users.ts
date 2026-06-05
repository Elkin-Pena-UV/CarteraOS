import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, type CreateUsuarioDto, type UpdateUsuarioDto } from '@/lib/services/userService'
import { toast } from 'sonner'

const QUERY_KEY = ['admin', 'usuarios']

export function useUsuarios() {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await userService.listar()
      return res.data   // interceptor ya desenvuelve un nivel → res es { ok, total, data }
    },
  })

  return { usuarios: data ?? [], isLoading, error }
}

export function useCrearUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateUsuarioDto) => userService.crear(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Usuario creado correctamente')
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Error al crear el usuario')
    },
  })
}

export function useActualizarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateUsuarioDto }) =>
      userService.actualizar(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Usuario actualizado')
    },
    onError: (err: any) => {
      toast.error(err?.message ?? 'Error al actualizar el usuario')
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      userService.resetPassword(id, password),
    onSuccess: () => toast.success('Contraseña actualizada'),
    onError: (err: any) => {
      toast.error(err?.message ?? 'Error al resetear la contraseña')
    },
  })
}