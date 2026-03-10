'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

function VerifyOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const otpFromUrl = searchParams.get('otp')

  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [otpVerified, setOtpVerified] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: 'Error',
        description: 'Email not found. Please start over.',
        variant: 'destructive',
      })
      router.push('/auth/forgot-password')
      return
    }

    if (!otp || otp.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit OTP.',
        variant: 'destructive',
      })
      return
    }

    setIsVerifying(true)
    try {
      // Verify OTP from database
      const { data: otpRecords, error: fetchError } = await supabase
        .from('password_reset_otps')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otp)
        .single()

      if (fetchError || !otpRecords) {
        toast({
          title: 'Error',
          description: 'Invalid or expired OTP. Please try again.',
          variant: 'destructive',
        })
        setIsVerifying(false)
        return
      }

      // Check if OTP is expired
      const expiresAt = new Date(otpRecords.expires_at)
      if (expiresAt < new Date()) {
        toast({
          title: 'Error',
          description: 'OTP has expired. Please request a new one.',
          variant: 'destructive',
        })
        setIsVerifying(false)
        return
      }

      // Mark OTP as used
      const { error: updateError } = await supabase
        .from('password_reset_otps')
        .update({ is_used: true })
        .eq('id', otpRecords.id)

      if (updateError) throw updateError

      setOtpVerified(true)
      toast({
        title: 'Success',
        description: 'OTP verified successfully!',
      })

      // Redirect to reset password after 2 seconds
      setTimeout(() => {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)
      }, 2000)
    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast({
        title: 'Error',
        description: 'Failed to verify OTP. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Email not found. Please start over.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Generate new OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString()

      // Store new OTP in database
      const { error: insertError } = await supabase
        .from('password_reset_otps')
        .insert({
          email: email,
          otp_code: newOtp,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        })

      if (insertError) throw insertError

      toast({
        title: 'Success',
        description: `New OTP generated: ${newOtp}`,
      })
      setTimeLeft(600)
      setOtp('')
    } catch (error) {
      console.error('Error resending OTP:', error)
      toast({
        title: 'Error',
        description: 'Failed to resend OTP. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (otpVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg text-center">
          <CardContent className="pt-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">OTP Verified!</h2>
            <p className="text-sm text-muted-foreground">Redirecting to reset password...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
          <CardDescription>Enter the 6-digit code sent to your email</CardDescription>
          {email && <p className="text-xs text-muted-foreground mt-2">{email}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          {otpFromUrl && (
            <Alert className="border-primary/20 bg-primary/10">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                OTP Code: <span className="font-mono font-bold text-primary">{otpFromUrl}</span>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium">
                OTP Code
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                disabled={isVerifying}
                className="h-11 bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <Button
              type="submit"
              disabled={isVerifying || otp.length !== 6}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </form>

          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <span className={`text-sm font-medium ${timeLeft <= 60 ? 'text-red-500' : 'text-muted-foreground'}`}>
                Expires in: {formatTime(timeLeft)}
              </span>
            </div>

            <Button
              onClick={handleResendOtp}
              disabled={isLoading || timeLeft > 540}
              variant="outline"
              className="w-full h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                'Resend OTP'
              )}
            </Button>
          </div>

          <div className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">
              <Button
                variant="link"
                className="p-0 h-auto text-primary hover:text-primary/80"
                onClick={() => router.push('/auth/forgot-password')}
              >
                Back to forgot password
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function VerifyOtpLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="h-8 bg-muted rounded w-32 mx-auto" />
          <div className="h-4 bg-muted rounded w-48 mx-auto mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-12 bg-muted rounded" />
          <div className="h-11 bg-muted rounded" />
          <div className="h-11 bg-muted rounded" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<VerifyOtpLoading />}>
      <VerifyOtpContent />
    </Suspense>
  )
}
