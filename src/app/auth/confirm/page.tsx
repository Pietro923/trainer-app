// app/auth/confirm/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function ConfirmEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          })

          if (error) {
            setStatus('error')
            setMessage(error.message)
          } else {
            setStatus('success')
            setMessage('¡Tu email ha sido confirmado exitosamente!')
            
            // Redirigir después de 2 segundos
            setTimeout(() => {
              router.push('/')
            }, 2000)
          }
        } else {
          setStatus('error')
          setMessage('Token de confirmación no válido')
        }
      } catch (err) {
        setStatus('error')
        setMessage('Error al confirmar el email')
      }
    }

    handleEmailConfirmation()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Confirmación de Email
          </CardTitle>
          <CardDescription>
            Verificando tu dirección de correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto animate-spin" />
              <p className="text-gray-600">Confirmando tu email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <p className="text-green-700 font-medium">{message}</p>
              <p className="text-gray-600">Serás redirigido automáticamente...</p>
              <Button onClick={() => router.push('/')} className="w-full">
                Ir al Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="w-16 h-16 text-orange-600 mx-auto" />
              <p className="text-orange-700 font-medium">{message}</p>
              <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                Volver al Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  )
}