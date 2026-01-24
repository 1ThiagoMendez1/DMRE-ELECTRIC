import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/supabase'

type Cliente = Database['public']['Tables']['clientes']['Row']
type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
type ClienteUpdate = Database['public']['Tables']['clientes']['Update']

export async function getClientes() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching clientes:', error)
        throw new Error('Error al obtener clientes')
    }

    return data
}

export async function getClienteById(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching cliente:', error)
        return null
    }

    return data
}

export async function createCliente(cliente: ClienteInsert) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('clientes')
        .insert(cliente)
        .select()
        .single()

    if (error) {
        console.error('Error creating cliente:', error)
        throw new Error('Error al crear cliente')
    }

    return data
}

export async function updateCliente(id: string, cliente: ClienteUpdate) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('clientes')
        .update(cliente)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating cliente:', error)
        throw new Error('Error al actualizar cliente')
    }

    return data
}

export async function deleteCliente(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting cliente:', error)
        throw new Error('Error al eliminar cliente')
    }

    return true
}
