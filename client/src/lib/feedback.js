import { supabase } from './supabase'

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

async function currentUserId() {
  const client = requireClient()
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return data.session?.user?.id ?? null
}

export async function submitFeedback({ reportReference, rating, message }) {
  const client = requireClient()
  const userId = await currentUserId()
  if (!userId) throw new Error('You need to sign in again.')

  const score = Number(rating)
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error('Choose a rating from 1 to 5.')
  }

  const { data, error } = await client
    .from('feedback')
    .insert({
      user_id: userId,
      report_reference: reportReference || null,
      rating: score,
      message: (message || '').trim() || null,
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}
