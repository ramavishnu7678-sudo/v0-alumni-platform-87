"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Calendar, Plus, AlertCircle, Clock, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ScheduleMeetingPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    meetingDate: "",
    meetingTime: "",
    duration: "60",
    maxParticipants: "50",
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileData?.role !== "alumni") {
        router.push("/dashboard")
        return
      }

      setProfile(profileData)
    }

    getProfile()
  }, [router, supabase])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const generateMeetingDetails = () => {
    // Generate a simple meeting ID and password
    const meetingId = Math.random().toString(36).substring(2, 12).toUpperCase()
    const password = Math.random().toString(36).substring(2, 8)
    const meetingUrl = `https://meet.google.com/${meetingId.toLowerCase()}`

    return { meetingId, password, meetingUrl }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (!formData.title || !formData.meetingDate || !formData.meetingTime) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    // Validate date is in the future
    const meetingDateTime = new Date(`${formData.meetingDate}T${formData.meetingTime}`)
    if (meetingDateTime <= new Date()) {
      setError("Meeting date and time must be in the future")
      setIsLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("You must be logged in to schedule a meeting")
        setIsLoading(false)
        return
      }

      const { meetingId, password, meetingUrl } = generateMeetingDetails()

      const { error: insertError } = await supabase.from("meetings").insert({
        title: formData.title,
        description: formData.description || null,
        host_id: user.id,
        meeting_date: meetingDateTime.toISOString(),
        duration_minutes: Number.parseInt(formData.duration),
        max_participants: Number.parseInt(formData.maxParticipants),
        meeting_url: meetingUrl,
        meeting_id: meetingId,
        password: password,
      })

      if (insertError) throw insertError

      setSuccess("Meeting scheduled successfully! Participants can now register for your session.")

      // Reset form
      setFormData({
        title: "",
        description: "",
        meetingDate: "",
        meetingTime: "",
        duration: "60",
        maxParticipants: "50",
      })

      // Redirect after a delay
      setTimeout(() => {
        router.push("/dashboard/meetings")
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0]
  // Get minimum time if date is today
  const now = new Date()
  const minTime =
    formData.meetingDate === today
      ? `${now.getHours().toString().padStart(2, "0")}:${(now.getMinutes() + 30).toString().padStart(2, "0")}`
      : "00:00"

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Plus className="h-8 w-8 text-accent" />
            Schedule Virtual Meeting
          </h1>
          <p className="text-muted-foreground mt-2">
            Create a networking session, mentorship meeting, or knowledge sharing event.
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Meeting Details
            </CardTitle>
            <CardDescription>Fill in the details for your virtual meeting session.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Career Guidance Session for CS Students"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what participants can expect from this meeting..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="meetingDate">Meeting Date *</Label>
                  <Input
                    id="meetingDate"
                    type="date"
                    min={today}
                    value={formData.meetingDate}
                    onChange={(e) => handleInputChange("meetingDate", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meetingTime">Meeting Time *</Label>
                  <Input
                    id="meetingTime"
                    type="time"
                    min={minTime}
                    value={formData.meetingTime}
                    onChange={(e) => handleInputChange("meetingTime", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Duration and Participants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    min="2"
                    max="100"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange("maxParticipants", e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Scheduling Meeting...
                    </div>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Meeting
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/50 bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-2">Meeting Guidelines</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Schedule meetings at least 1 hour in advance</li>
                    <li>• Consider time zones of your participants</li>
                    <li>• Provide clear meeting objectives</li>
                    <li>• Test your audio/video before the session</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-2">Meeting Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Automatic Google Meet link generation</li>
                    <li>• Registration management system</li>
                    <li>• Email notifications to participants</li>
                    <li>• Meeting reminders and updates</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
