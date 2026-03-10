'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Password validation checks
  const validations = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    matches: password === confirmPassword && password.length > 0,
  }

  const isValid = Object.values(validations).every(v => v === true)

  const handleResetPassword = async (e: React.FormEvent) => {
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

    if (!isValid) {
      toast({
        title: 'Error',
        description: 'Please meet all password requirements.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Get user by email
      const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers()
      const user = users?.find(u => u.email === email)

      if (!user) {
        toast({
          title: 'Error',
          description: 'User not found.',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      // Update password using admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password }
      )

      if (updateError) throw updateError

      toast({
        title: 'Success',
        description: 'Password reset successfully!',
      })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (error) {
      console.error('Error resetting password:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Create a new strong password</CardDescription>
          {email && <p className="text-xs text-muted-foreground mt-2">{email}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11 bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11 bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Password must contain:</p>
              <div className="space-y-1">
                <div className="flex items-center text-xs">
                  {validations.minLength ? (
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span>At least 8 characters</span>
                </div>
                <div className="flex items-center text-xs">
                  {validations.hasUppercase ? (
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span>Uppercase letter (A-Z)</span>
                </div>
                <div className="flex items-center text-xs">
                  {validations.hasLowercase ? (
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span>Lowercase letter (a-z)</span>
                </div>
                <div className="flex items-center text-xs">
                  {validations.hasNumber ? (
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span>Number (0-9)</span>
                </div>
                <div className="flex items-center text-xs">
                  {validations.hasSpecial ? (
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span>Special character (!@#$%^&*)</span>
                </div>
                <div className="flex items-center text-xs">
                  {validations.matches ? (
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span>Passwords match</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">
              <Button
                variant="link"
                className="p-0 h-auto text-primary hover:text-primary/80"
                onClick={() => router.push('/auth/login')}
              >
                Back to login
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
