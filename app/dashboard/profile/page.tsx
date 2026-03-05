"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Building2, GraduationCap, Phone, Linkedin, Mail, Calendar, Camera, Upload } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Profile {
  id: string
  full_name: string
  email: string
  role: "student" | "alumni" | "admin"
  current_company?: string
  current_position?: string
  department: string
  graduation_year: number
  phone?: string
  linkedin_url?: string
  bio?: string
  profile_image_url?: string
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
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
      if (!user) return

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile information.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!profile) return

    setIsUploadingImage(true)
    try {
      // Create a preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        upsert: true,
      })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Update profile with image URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_image_url: publicUrl })
        .eq("id", profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, profile_image_url: publicUrl })
      setPreviewImage(null)
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "Failed to upload profile picture.",
        variant: "destructive",
      })
      setPreviewImage(null)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleSave = async (formData: FormData) => {
    if (!profile) return

    setIsSaving(true)
    try {
      const updates = {
        full_name: formData.get("full_name") as string,
        current_company: (formData.get("current_company") as string) || null,
        current_position: (formData.get("current_position") as string) || null,
        department: formData.get("department") as string,
        graduation_year: Number.parseInt(formData.get("graduation_year") as string),
        phone: (formData.get("phone") as string) || null,
        linkedin_url: (formData.get("linkedin_url") as string) || null,
        bio: (formData.get("bio") as string) || null,
      }

      const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id)

      if (error) throw error

      setProfile({ ...profile, ...updates })
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    )
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "alumni":
        return "bg-golden/10 text-golden border-golden/20"
      case "student":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="bg-golden hover:bg-golden/90">
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview Card */}
        <Card className="md:col-span-1 border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewImage || profile.profile_image_url || ""} />
                <AvatarFallback className="bg-golden/10 text-golden text-lg">
                  {profile.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploadingImage ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <div className="flex gap-2">
                      <label className="cursor-pointer p-2 bg-golden hover:bg-golden/90 rounded-full transition-colors" title="Upload from gallery">
                        <Upload className="h-4 w-4 text-black" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleGalleryUpload}
                          disabled={isUploadingImage}
                          className="hidden"
                        />
                      </label>
                      <label className="cursor-pointer p-2 bg-golden hover:bg-golden/90 rounded-full transition-colors" title="Capture from camera">
                        <Camera className="h-4 w-4 text-black" />
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleCameraCapture}
                          disabled={isUploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
            <CardTitle className="text-xl">{profile.full_name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              {profile.email}
            </CardDescription>
            <div className="flex justify-center mt-2">
              <Badge className={getRoleBadgeColor(profile.role)}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span>{profile.department}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Class of {profile.graduation_year}</span>
            </div>
            {profile.current_company && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{profile.current_company}</span>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.linkedin_url && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Linkedin className="h-4 w-4" />
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-golden hover:underline"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Details Card */}
        <Card className="md:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {isEditing ? "Edit Profile Information" : "Profile Information"}
            </CardTitle>
            <CardDescription>
              {isEditing ? "Update your personal and professional details" : "Your personal and professional details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form action={handleSave} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
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
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="graduation_year">Graduation Year *</Label>
                    <Input
                      id="graduation_year"
                      name="graduation_year"
                      type="number"
                      min="1950"
                      max="2030"
                      defaultValue={profile.graduation_year}
                      required
                      className="border-border/50 focus:border-golden"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={profile.phone || ""}
                      className="border-border/50 focus:border-golden"
                    />
                  </div>
                </div>

                {profile.role === "alumni" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="current_company">Current Company</Label>
                      <Input
                        id="current_company"
                        name="current_company"
                        defaultValue={profile.current_company || ""}
                        className="border-border/50 focus:border-golden"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_position">Current Position</Label>
                      <Input
                        id="current_position"
                        name="current_position"
                        defaultValue={profile.current_position || ""}
                        className="border-border/50 focus:border-golden"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    name="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    defaultValue={profile.linkedin_url || ""}
                    className="border-border/50 focus:border-golden"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Tell us about yourself, your interests, and your goals..."
                    defaultValue={profile.bio || ""}
                    rows={4}
                    className="border-border/50 focus:border-golden resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isSaving} className="bg-golden hover:bg-golden/90">
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="border-border/50 hover:bg-muted"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Department:</span>
                        <p className="font-medium">{profile.department}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Graduation Year:</span>
                        <p className="font-medium">{profile.graduation_year}</p>
                      </div>
                      {profile.phone && (
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <p className="font-medium">{profile.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {profile.role === "alumni" && (profile.current_company || profile.current_position) && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Professional Information</h3>
                      <div className="space-y-3 text-sm">
                        {profile.current_company && (
                          <div>
                            <span className="text-muted-foreground">Company:</span>
                            <p className="font-medium">{profile.current_company}</p>
                          </div>
                        )}
                        {profile.current_position && (
                          <div>
                            <span className="text-muted-foreground">Position:</span>
                            <p className="font-medium">{profile.current_position}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <>
                    <Separator className="bg-border/50" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">About</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                    </div>
                  </>
                )}

                <Separator className="bg-border/50" />
                <div className="text-xs text-muted-foreground">
                  Member since{" "}
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
