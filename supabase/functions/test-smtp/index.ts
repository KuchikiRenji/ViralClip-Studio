import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🧪 Testing SMTP.com connection...')

    // SMTP.com configuration
    const SMTP_HOST = 'send.smtp.com'
    const SMTP_PORT = 465
    const SMTP_USER = 'support@zitro.ai'
    const SMTP_PASS = 'ugihuoigyuv4Bhvdu4'

    console.log('📋 SMTP Configuration:', {
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER,
      passLength: SMTP_PASS.length
    })

    // Test SMTP connection
    try {
      const { SmtpClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts')
      
      const client = new SmtpClient()
      
      console.log('🔌 Attempting to connect to SMTP.com...')
      
      await client.connect({
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        username: SMTP_USER,
        password: SMTP_PASS,
        tls: false, // Port 465 uses SSL, not TLS
        tlsOptions: {
          rejectUnauthorized: false
        }
      })

      console.log('✅ Successfully connected to SMTP.com!')

      // Test sending a simple email
      console.log('📧 Testing email send...')
      const testResult = await client.send({
        from: `Zitro AI <${SMTP_USER}>`,
        to: SMTP_USER, // Send test email to self
        subject: 'SMTP.com Connection Test',
        content: 'This is a test email to verify SMTP.com connection is working.',
        html: '<p>This is a test email to verify SMTP.com connection is working.</p>'
      })

      await client.close()

      console.log('✅ Test email sent successfully!', testResult)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'SMTP.com connection test successful!',
          details: {
            host: SMTP_HOST,
            port: SMTP_PORT,
            user: SMTP_USER,
            connection: 'OK',
            emailSent: true,
            messageId: testResult.messageId || 'N/A'
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } catch (smtpError) {
      const errorMessage = smtpError instanceof Error ? smtpError.message : String(smtpError)
      const errorStack = smtpError instanceof Error ? smtpError.stack : undefined
      
      console.error('❌ SMTP.com connection test failed:', {
        error: errorMessage,
        stack: errorStack,
        host: SMTP_HOST,
        port: SMTP_PORT,
        user: SMTP_USER
      })

      // Provide helpful error messages
      let userFriendlyError = errorMessage
      if (errorMessage.includes('authentication') || errorMessage.includes('535') || errorMessage.includes('Invalid')) {
        userFriendlyError = 'Authentication failed. Please check your SMTP username and password.'
      } else if (errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
        userFriendlyError = 'Connection failed. Please check the SMTP host and port, and ensure your firewall allows connections.'
      } else if (errorMessage.includes('certificate') || errorMessage.includes('TLS')) {
        userFriendlyError = 'TLS/SSL certificate error. Try using port 587 with TLS instead of port 465.'
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: 'SMTP.com connection test failed',
          error: userFriendlyError,
          details: {
            host: SMTP_HOST,
            port: SMTP_PORT,
            user: SMTP_USER,
            rawError: errorMessage,
            stack: errorStack
          },
          suggestions: [
            'Verify your SMTP.com credentials are correct',
            'Check that support@zitro.ai is verified in your SMTP.com account',
            'Ensure your SMTP.com account is active and not suspended',
            'Try port 587 with TLS if port 465 doesn\'t work',
            'Check SMTP.com dashboard for any IP restrictions'
          ]
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Unexpected error during SMTP test',
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

