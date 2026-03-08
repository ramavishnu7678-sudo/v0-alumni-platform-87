'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { Camera, Upload, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  full_name: string
  email: string
  role: 'student' | 'alumni' | 'admin'
  current_company?: string
  current_position?: string
  department: string
  graduation_year: number
  phone?: string
  linkedin_url?: string
  bio?: string
  profile_image_url?: string
}

export default function EditProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(profileData)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!profile) return

    setIsUploadingImage(true)
    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)

      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        upsert: true,
      })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, profile_image_url: publicUrl })
      setPreviewImage(null)
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully!',
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload profile picture.',
        variant: 'destructive',
      })
      setPreviewImage(null)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profile) return

    setIsSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      const updates = {
        full_name: formData.get('full_name') as string,
        current_company: (formData.get('current_company') as string) || null,
        current_position: (formData.get('current_position') as string) || null,
        department: formData.get('department') as string,
        graduation_year: Number.parseInt(formData.get('graduation_year') as string),
        phone: (formData.get('phone') as string) || null,
        linkedin_url: (formData.get('linkedin_url') as string) || null,
        bio: (formData.get('bio') as string) || null,
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, ...updates })
      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      })

      setTimeout(() => {
        router.push('/dashboard/profile')
      }, 1500)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  return (
    <main className="flex-1 space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
          <p className="text-sm text-muted-foreground">Update your profile information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Photo Section */}
        <Card className="md:col-span-1 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Profile Picture</CardTitle>
            <CardDescription>Upload your photo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative group">
              <Avatar className="h-40 w-40 mx-auto border-4 border-golden/20">
                <AvatarImage src={previewImage || profile.profile_image_url || ''} />
                <AvatarFallback className="bg-golden/10 text-golden text-3xl">
                  {profile.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {isUploadingImage ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                ) : (
                  <div className="flex gap-3">
                    <label className="cursor-pointer p-3 bg-golden hover:bg-golden/90 rounded-full transition-all duration-200">
                      <Upload className="h-5 w-5 text-black" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                    <label className="cursor-pointer p-3 bg-golden hover:bg-golden/90 rounded-full transition-all duration-200">
                      <Camera className="h-5 w-5 text-black" />
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Hover to upload from gallery or camera
            </p>
          </CardContent>
        </Card>

        {/* Form Section */}
        <Card className="md:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={profile.full_name}
                  required
                  className="border-border/50 focus:border-golden"
                />
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="border-border/50 bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  name="department"
                  defaultValue={profile.department}
                  required
                  className="border-border/50 focus:border-golden"
                />
              </div>

              {/* Graduation Year */}
              <div className="space-y-2">
                <Label htmlFor="graduation_year">Graduation Year *</Label>
                <Input
                  id="graduation_year"
                  name="graduation_year"
                  type="number"
                  min="1926"
                  max="2070"
                  defaultValue={profile.graduation_year}
                  required
                  className="border-border/50 focus:border-golden"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone || ''}
                  className="border-border/50 focus:border-golden"
                />
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn Profile URL</Label>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  defaultValue={profile.linkedin_url || ''}
                  className="border-border/50 focus:border-golden"
                />
              </div>

              {/* Company & Position (For Alumni) */}
              {profile.role === 'alumni' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="current_company">Current Company</Label>
                    <Input
                      id="current_company"
                      name="current_company"
                      defaultValue={profile.current_company || ''}
                      className="border-border/50 focus:border-golden"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current_position">Current Position</Label>
                    <Input
                      id="current_position"
                      name="current_position"
                      defaultValue={profile.current_position || ''}
                      className="border-border/50 focus:border-golden"
                    />
                  </div>
                </>
              )}

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">About You</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about yourself..."
                  defaultValue={profile.bio || ''}
                  rows={4}
                  className="border-border/50 focus:border-golden"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-golden hover:bg-golden/90 text-black"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href="/dashboard/profile">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
