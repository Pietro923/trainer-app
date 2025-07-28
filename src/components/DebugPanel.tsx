// components/DebugPanel.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type DebugPanelProps = {
  routineId: string
}

export default function DebugPanel({ routineId }: DebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      // Test 1: Verificar conexión básica (conteo simple)
      const { data: testData, error: testError } = await supabase
        .from('exercises')
        .select('id')
        .limit(1)

      console.log('Connection test:', { testData, testError })

      // Test 2: Verificar la rutina específica
      const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .select('*')
        .eq('id', routineId)
        .single()

      console.log('Routine test:', { routineData, routineError })

      // Test 3: Intentar crear un ejercicio simple
      const testExercise = {
        routine_id: routineId,
        name: 'Test Exercise',
        exercise_order: 999,
        sets: 1,
        reps: '1',
        weight: null,
        rest_time: null,
        notes: null,
        video_url: null,
        image_url: null,
      }

      const { data: insertData, error: insertError } = await supabase
        .from('exercises')
        .insert([testExercise])
        .select()

      console.log('Insert test:', { insertData, insertError })

      // Si se creó exitosamente, eliminarlo
      if (insertData && insertData.length > 0) {
        await supabase
          .from('exercises')
          .delete()
          .eq('id', insertData[0].id)
        console.log('Test exercise deleted')
      }

      setDebugInfo({
        connection: testError ? 'ERROR' : 'OK',
        routine: routineError ? 'ERROR' : 'OK',
        insert: insertError ? 'ERROR' : 'OK',
        errors: {
          testError,
          routineError,
          insertError
        }
      })

    } catch (error) {
      console.error('Debug error:', error)
      setDebugInfo({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-4 bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="text-sm">🐛 Debug Panel (Temporal)</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testConnection} disabled={loading} size="sm">
          {loading ? 'Probando...' : 'Probar Conexión'}
        </Button>
        
        {debugInfo && (
          <div className="mt-2 text-xs">
            <pre className="bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}