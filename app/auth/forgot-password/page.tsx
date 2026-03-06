'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { Mail, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address.',
        variant: 'destructive',
      })
      return
    }

    if (!email.endsWith('@mce.edu.in')) {
      toast({
        title: 'Error',
        description: 'Please use your @mce.edu.in email address.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Check if user exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profileError || !profile) {
        toast({
          title: 'Error',
          description: 'No account found with this email address.',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      // Generate OTP locally (6-digit code)
      const otp = Math.floor(100000 + Math.random() * 900000).toString()

      // Store OTP in database
      const { error: insertError } = await supabase
        .from('password_reset_otps')
        .insert({
          email: email,
          otp_code: otp,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        })

      if (insertError) throw insertError

      setGeneratedOtp(otp)
      setOtpSent(true)

      toast({
        title: 'Success',
        description: `OTP has been generated. Your code is: ${otp}`,
      })
    } catch (error) {
      console.error('Error generating OTP:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate OTP. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = () => {
    if (!email || !generatedOtp) {
      toast({
        title: 'Error',
        description: 'Please enter OTP.',
        variant: 'destructive',
      })
      return
    }

    router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}&otp=${generatedOtp}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            {otpSent ? 'OTP has been generated' : 'Enter your email to receive a password reset code'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@mce.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11 bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating OTP...
                  </>
                ) : (
                  'Generate OTP'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                <p className="text-sm text-foreground mb-2">Your OTP Code:</p>
                <p className="text-2xl font-bold text-primary tracking-widest">{generatedOtp}</p>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                This code will expire in 10 minutes. Copy the code and verify it on the next page.
              </p>

              <Button
                onClick={handleVerifyOtp}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                Continue to Verify OTP
              </Button>

              <Button
                onClick={() => {
                  setOtpSent(false)
                  setGeneratedOtp('')
                }}
                variant="outline"
                className="w-full h-11"
              >
                Request New OTP
              </Button>
            </div>
          )}

          <div className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-primary hover:text-primary/80 underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
