import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'test@ogoo.dev',
    password: 'ogoo1234!',
    email_confirm: true,
  })

  if (error) {
    console.error('실패:', error.message)
  } else {
    console.log('계정 생성 완료')
    console.log('이메일:', 'test@ogoo.dev')
    console.log('비밀번호:', 'ogoo1234!')
    console.log('user id:', data.user.id)
  }
}

main()
