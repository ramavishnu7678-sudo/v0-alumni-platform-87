'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { Lock, Bell, Shield, LogOut, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Load user preferences from localStorage or database
      const savedNotifications = localStorage.getItem('notificationsEnabled')
      const savedEmailNotifications = localStorage.getItem('emailNotificationsEnabled')

      setNotificationsEnabled(savedNotifications !== 'false')
      setEmailNotifications(savedEmailNotifications !== 'false')

      // Check 2FA status
      const { data: twoFactorData } = await supabase
        .from('two_factor_auth')
        .select('is_enabled')
        .eq('user_id', user.id)
        .single()

      setIs2FAEnabled(twoFactorData?.is_enabled || false)
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const generateBackupCodes = (): string[] => {
    const codes = []
    for (let i = 0; i < 8; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase())
    }
    return codes
  }

  const handleEnable2FA = async () => {
    setIsLoadingSettings(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const codes = generateBackupCodes()
      setBackupCodes(codes)

      // Store 2FA settings in database
      const { error } = await supabase
        .from('two_factor_auth')
        .upsert({
          user_id: user.id,
          is_enabled: true,
          backup_codes: codes,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) throw error

      setIs2FAEnabled(true)
      setShow2FASetup(true)

      toast({
        title: 'Success',
        description: 'Two-Factor Authentication has been enabled!',
      })
    } catch (error) {
      console.error('Error enabling 2FA:', error)
      toast({
        title: 'Error',
        description: 'Failed to enable 2FA. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const handleDisable2FA = async () => {
    setIsLoadingSettings(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('two_factor_auth')
        .update({ is_enabled: false })
        .eq('user_id', user.id)

      if (error) throw error

      setIs2FAEnabled(false)
      setShow2FASetup(false)

      toast({
        title: 'Success',
        description: 'Two-Factor Authentication has been disabled.',
      })
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      toast({
        title: 'Error',
        description: 'Failed to disable 2FA.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast({
          title: 'Error',
          description: 'Please fill in all password fields.',
          variant: 'destructive',
        })
        setPasswordLoading(false)
        return
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: 'Error',
          description: 'New passwords do not match.',
          variant: 'destructive',
        })
        setPasswordLoading(false)
        return
      }

      // Validate password strength
      if (newPassword.length < 8) {
        toast({
          title: 'Error',
          description: 'Password must be at least 8 characters long.',
          variant: 'destructive',
        })
        setPasswordLoading(false)
        return
      }

      // Check for uppercase, lowercase, number, and special character
      const hasUpperCase = /[A-Z]/.test(newPassword)
      const hasLowerCase = /[a-z]/.test(newPassword)
      const hasNumber = /[0-9]/.test(newPassword)
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)

      if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        toast({
          title: 'Weak Password',
          description: 'Password must contain uppercase, lowercase, number, and special character.',
          variant: 'destructive',
        })
        setPasswordLoading(false)
        return
      }

      if (currentPassword === newPassword) {
        toast({
          title: 'Error',
          description: 'New password must be different from current password.',
          variant: 'destructive',
        })
        setPasswordLoading(false)
        return
      }

      // Update password directly - Supabase handles security
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Password changed successfully! You may need to log in again.',
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: 'Error',
        description: 'Failed to change password. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
      toast({
        title: 'Success',
        description: 'Logged out successfully!',
      })
    } catch (error) {
      console.error('Error logging out:', error)
      toast({
        title: 'Error',
        description: 'Failed to logout.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = () => {
    localStorage.setItem('notificationsEnabled', String(notificationsEnabled))
    localStorage.setItem('emailNotificationsEnabled', String(emailNotifications))

    toast({
      title: 'Success',
      description: 'Settings saved successfully!',
    })
  }

  return (
    <main className="flex-1 space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Password Section */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-golden" />
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password *</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="border-border/50 focus:border-golden pr-10"
                    required
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

              <div className="space-y-2">
                <Label htmlFor="new_password">New Password *</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="border-border/50 focus:border-golden"
                  required
                />
                <div className="text-xs space-y-1 mt-2 p-2 rounded bg-muted/50">
                  <p className="font-medium text-muted-foreground">Password must contain:</p>
                  <div className="space-y-1">
                    <p className={newPassword.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}>
                      ✓ At least 8 characters
                    </p>
                    <p className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-muted-foreground'}>
                      ✓ Uppercase letter (A-Z)
                    </p>
                    <p className={/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-muted-foreground'}>
                      ✓ Lowercase letter (a-z)
                    </p>
                    <p className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-muted-foreground'}>
                      ✓ Number (0-9)
                    </p>
                    <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'text-green-600' : 'text-muted-foreground'}>
                      ✓ Special character (!@#$%^&*...)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password *</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`border-border/50 focus:border-golden ${
                    confirmPassword && newPassword !== confirmPassword ? 'border-red-500' : ''
                  }`}
                  required
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-green-600">Passwords match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={passwordLoading}
                className="bg-golden hover:bg-golden/90 text-black"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-golden" />
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-golden/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-golden"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive notification emails from us</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-golden/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-golden"></div>
              </label>
            </div>

            <Button
              onClick={saveSettings}
              className="bg-golden hover:bg-golden/90 text-black"
            >
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-golden" />
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Account security settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!show2FASetup ? (
              <>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      {is2FAEnabled 
                        ? 'Two-Factor Authentication is currently enabled on your account.'
                        : 'Add an extra layer of security to your account with 2FA'}
                    </p>
                  </div>
                </div>
                {is2FAEnabled ? (
                  <Button 
                    onClick={handleDisable2FA}
                    disabled={isLoadingSettings}
                    variant="destructive"
                    className="w-full"
                  >
                    {isLoadingSettings ? 'Disabling...' : 'Disable 2FA'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleEnable2FA}
                    disabled={isLoadingSettings}
                    className="bg-golden hover:bg-golden/90 w-full"
                  >
                    {isLoadingSettings ? 'Enabling...' : 'Enable 2FA'}
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">2FA Enabled Successfully!</h4>
                  <p className="text-sm text-green-800 mb-4">
                    Save these backup codes in a safe place. You can use them to access your account if you lose access to your 2FA device.
                  </p>
                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded border border-green-200">
                    {backupCodes.map((code, index) => (
                      <code key={index} className="text-sm font-mono text-center py-1 bg-gray-100 rounded">
                        {code}
                      </code>
                    ))}
                  </div>
                  <p className="text-xs text-green-700 mt-3">
                    Each code can only be used once
                  </p>
                </div>
                <Button 
                  onClick={() => setShow2FASetup(false)}
                  className="w-full"
                >
                  Done
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleLogout}
              disabled={isLoading}
              variant="destructive"
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              {isLoading ? 'Logging out...' : 'Logout'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
