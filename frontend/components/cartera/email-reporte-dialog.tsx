"use client"

// frontend/components/cartera/email-reporte-dialog.tsx
//
// Dialog GENÉRICO para envío de reportes por email.
// Funciona desde el drawer de cliente Y desde cualquier dashboard.
//
// API:
//   titulo     → aparece como subtítulo del dialog (ej. "Dashboard de Cartera — hoy")
//   asuntoDefault → valor inicial del campo Asunto (editable)
//   reportes   → array de { tipo, payload, nombre, label, descripcion, requerido }
//                requerido=true → siempre adjunto (no se puede quitar)
//                requerido=false → checkbox opcional

import { useState, useEffect } from "react"
import { Send, Loader2, FileText, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { cn }       from "@/lib/utils"
import api          from "@/lib/axios"

// ─────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────

export interface EmailReporteItem {
  /** Tipo de reporte — debe coincidir con los tipos del emailService backend */
  tipo:        "cliente" | "variacion" | "rotacion" | "general"
  /** Payload completo que recibe el generador de PDF en el backend */
  payload:     object
  /** Nombre del archivo adjunto, ej. "reporte_general_20260610.pdf" */
  nombre:      string
  /** Etiqueta visible en el listado de adjuntos */
  label:       string
  /** Descripción secundaria en el listado */
  descripcion: string
  /** true = siempre incluido (sin checkbox). false = opcional (con checkbox) */
  requerido:   boolean
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function destinatariosValidos(destinatario: string): boolean {
  const lista = destinatario.split(',').map(d => d.trim()).filter(Boolean)
  return lista.length > 0 && lista.every(d => EMAIL_REGEX.test(d))
}

export interface EmailReporteDialogProps {
  open:          boolean
  onClose:       () => void
  /** Subtítulo del dialog, ej. nombre del cliente o módulo */
  titulo:        string
  /** Asunto por defecto (el usuario puede editarlo) */
  asuntoDefault: string
  /** Lista de reportes disponibles para adjuntar */
  reportes:      EmailReporteItem[]
}

// ─────────────────────────────────────────────
// Grupo de Gmail por defecto (editable en UI)
// ─────────────────────────────────────────────
const GRUPO_GMAIL_DEFAULT = "" // ← Reemplazar con la dirección real cuando esté definida

// ─────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────

export function EmailReporteDialog({
  open,
  onClose,
  titulo,
  asuntoDefault,
  reportes,
}: EmailReporteDialogProps) {

  // Estado de checkboxes para los reportes opcionales
  // clave: nombre del archivo (único por reporte)
  const [seleccionados, setSeleccionados] = useState<Record<string, boolean>>(
    () => Object.fromEntries(reportes.map(r => [r.nombre, true]))
  )

  const [destinatario, setDestinatario] = useState(GRUPO_GMAIL_DEFAULT)
  const [asunto,       setAsunto]       = useState(asuntoDefault)
  const [cuerpo,       setCuerpo]       = useState("")

  const [enviando,  setEnviando]  = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null)

  useEffect(() => {
  if (open) {
    setAsunto(asuntoDefault)
    setCuerpo("")
    setDestinatario(GRUPO_GMAIL_DEFAULT)
    setSeleccionados(Object.fromEntries(reportes.map(r => [r.nombre, true])))
    setResultado(null)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, asuntoDefault])

  // Reportes que se van a adjuntar (requeridos siempre + opcionales marcados)
  const reportesSeleccionados = reportes.filter(
    r => r.requerido || seleccionados[r.nombre]
  )
  const adjuntosCount = reportesSeleccionados.length

  // ─────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────
  const handleEnviar = async () => {
    if (!destinatariosValidos(destinatario)) return
    setEnviando(true)
    setResultado(null)

    try {
      const response = await (api.post("/email/reporte", {
        destinatario: destinatario.split(',').map(d => d.trim()).filter(Boolean).join(', '),
        asunto:       asunto.trim(),
        cuerpo:       cuerpo.trim(),
        reportes: reportesSeleccionados.map(r => ({
            tipo:        r.tipo,
            payload:     r.payload,
            nombre:      r.nombre,
            descripcion: r.label,   // usa el label legible como descripción en el cuerpo
            })),
      }) as unknown as Promise<{ ok: boolean; mensaje: string }>)

      setResultado({ ok: true, mensaje: response.mensaje ?? "Correo enviado correctamente." })

    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Error al enviar el correo. Verifica la configuración de email en el servidor."
      setResultado({ ok: false, mensaje })
    } finally {
      setEnviando(false)
    }
  }

  // ─────────────────────────────────────────────
  // Reset al cerrar
  // ─────────────────────────────────────────────
  const handleClose = () => {
    if (enviando) return
    setResultado(null)
    setDestinatario(GRUPO_GMAIL_DEFAULT)
    setAsunto(asuntoDefault)
    setCuerpo("")
    setSeleccionados(Object.fromEntries(reportes.map(r => [r.nombre, true])))
    onClose()
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-[#ff6600]" />
            Enviar reporte por correo
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulario para enviar el reporte por correo electrónico
          </DialogDescription>
          <p className="text-sm text-muted-foreground">{titulo}</p>
        </DialogHeader>

        {/* ── Resultado éxito/error ────────────────────────────────────── */}
        {resultado && (
          <div
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              resultado.ok
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
            )}
          >
            {resultado.mensaje}
          </div>
        )}

        {/* ── Formulario ───────────────────────────────────────────────── */}
        {!resultado?.ok && (
          <div className="space-y-4">

            {/* Destinatario */}
            <div className="space-y-1.5">
              <Label htmlFor="email-dest">Destinatario</Label>
              <Input
                id="email-dest"
                type="text"
                placeholder="correo1@empresa.com, correo2@empresa.com"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                disabled={enviando}
              />
              <p className="text-xs text-muted-foreground">
              Puedes ingresar varios correos separados por coma
              </p>
            </div>

            {/* Asunto */}
            <div className="space-y-1.5">
              <Label htmlFor="email-asunto">Asunto</Label>
              <Input
                id="email-asunto"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                disabled={enviando}
              />
            </div>

            {/* Adjuntos */}
            <div className="space-y-2">
              <Label>Adjuntos ({adjuntosCount} PDF{adjuntosCount !== 1 ? "s" : ""})</Label>

              {reportes.map((r) => {
                const marcado = r.requerido || seleccionados[r.nombre]

                return (
                  <div
                    key={r.nombre}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      marcado && "border-[#ff6600]/30 bg-[#ff6600]/5"
                    )}
                  >
                    <FileText className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      r.requerido ? "text-[#ff6600]" : "text-muted-foreground"
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.descripcion}</p>
                    </div>

                    {/* Requerido → checkmark fijo. Opcional → checkbox */}
                    {r.requerido ? (
                      <div className="ml-auto mt-0.5 shrink-0">
                        <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-[#ff6600] bg-[#ff6600]">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <Checkbox
                        className="ml-auto mt-0.5 shrink-0"
                        checked={!!seleccionados[r.nombre]}
                        onCheckedChange={(v) =>
                          setSeleccionados(prev => ({ ...prev, [r.nombre]: !!v }))
                        }
                        disabled={enviando}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Cuerpo opcional */}
            <div className="space-y-1.5">
              <Label htmlFor="email-cuerpo">
                Mensaje{" "}
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="email-cuerpo"
                placeholder="Se usará un mensaje predeterminado si se deja vacío..."
                rows={3}
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                disabled={enviando}
                className="resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {resultado?.ok ? (
            <Button onClick={handleClose} className="bg-[#ff6600] text-white hover:bg-[#e65c00]">
              Cerrar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={enviando}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleEnviar}
                disabled={enviando || !destinatariosValidos(destinatario) || adjuntosCount === 0}
                className="bg-[#ff6600] text-white hover:bg-[#e65c00]"
              >
                {enviando
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Send className="mr-2 h-4 w-4" />
                }
                {enviando ? "Enviando..." : `Enviar ${adjuntosCount} PDF${adjuntosCount !== 1 ? "s" : ""}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
