import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function testResetEmail() {
  console.log('=== Testing Password Reset Email ===\n')
  console.log('Resend API Key:', process.env.RESEND_API_KEY?.slice(0, 10) + '...')
  console.log('Recipient:', 'xom-it-admin@xomoman.com\n')

  const tempPassword = 'TempPassword' + Math.random().toString(36).slice(2, 10)
  const resetLink = 'https://xomoman-hse.vercel.app/reset-password?token=sample-token'

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your XOM HSE account.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Your Temporary Password:</strong></p>
        <p style="font-size: 18px; color: #0066cc; font-weight: bold;">${tempPassword}</p>
      </div>
      
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      
      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        If you didn't request this, please ignore this email.
      </p>
    </div>
  `

  try {
    console.log('Sending email...\n')
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'xom-it-admin@xomoman.com',
      subject: 'XOM HSE - Password Reset',
      html: htmlContent,
    })

    if (response.error) {
      console.error('Error sending email:')
      console.error('Message:', response.error.message)
      console.error('Code:', (response.error as any).code)
      return false
    }

    console.log('✓ Email sent successfully!')
    console.log('Email ID:', response.data?.id)
    console.log('Recipient:', 'xom-it-admin@xomoman.com')
    console.log('Temporary Password:', tempPassword)
    console.log('\nPlease check your email inbox within 1-2 minutes.')
    return true
  } catch (error: any) {
    console.error('Exception occurred:')
    console.error('Message:', error.message)
    console.error('Status:', error.status)
    console.error('Stack:', error.stack)
    return false
  }
}

testResetEmail()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Test failed:', error)
    process.exit(1)
  })
