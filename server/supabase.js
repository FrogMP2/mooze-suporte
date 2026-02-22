import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// In production, .env is in the same directory; locally it's in the parent
dotenv.config()
dotenv.config({ path: '../.env' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
