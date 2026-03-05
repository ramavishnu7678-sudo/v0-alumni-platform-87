import { Label } from "@/components/ui/label"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Calendar, Clock, Users, Video, ArrowLeft, UserCheck, ExternalLink, Mail } from "lucide-react"

interface MeetingPageProps {
  params: Promise<{ id: string }>
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch meeting with host information and registrations
  const { data: meeting } = await supabase
    .from("meetings")
    .select(`
      *,
      profiles:host_id (
        full_name,
        current_company,
        current_position,
        profile_image_url,
        linkedin_url,
        bio
      ),
      meeting_registrations (
        id,
        user_id,
        registered_at,
        profiles:user_id (
          full_name,
          profile_image_url
        )
      )
    `)
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (!meeting) {
    notFound()
  }

  // Check if user is registered
  const isRegistered = meeting.meeting_registrations?.some((r) => r.user_id === user.id)
  const registrationCount = meeting.meeting_registrations?.length || 0
  const isHost = meeting.host_id === user.id

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
  }

  const getStatusColor = (meetingDate: string) => {
    const now = new Date()
    const meeting = new Date(meetingDate)
    const diffHours = (meeting.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours < 0) return "bg-gray-500/10 text-gray-700 border-gray-200"
    if (diffHours < 1) return "bg-red-500/10 text-red-700 border-red-200"
    if (diffHours < 24) return "bg-orange-500/10 text-orange-700 border-orange-200"
    return "bg-green-500/10 text-green-700 border-green-200"
  }

  const getStatusText = (meetingDate: string) => {
    const now = new Date()
    const meetingTime = new Date(meetingDate)
    const diffHours = (meetingTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours < 0) return "Completed"
    if (diffHours < 1) return "Starting Soon"
    if (diffHours < 24) return "Tomorrow"
    return "Upcoming"
  }

  const { date, time } = formatDateTime(meeting.meeting_date)
  const isPastMeeting = new Date(meeting.meeting_date) < new Date()

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard/meetings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
          </Link>
        </Button>

        {/* Meeting Header */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold">{meeting.title}</h1>
                  <Badge variant="outline" className={`${getStatusColor(meeting.meeting_date)}`}>
                    {getStatusText(meeting.meeting_date)}
                  </Badge>
                </div>

                <div className="flex items-center gap-6 text-muted-foreground mb-4">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">{date}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {time} ({meeting.duration_minutes} min)
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {registrationCount}/{meeting.max_participants} registered
                  </span>
                </div>

                <div className="flex gap-4">
                  {!isPastMeeting && (
                    <>
                      {isRegistered ? (
                        <Button disabled className="bg-green-600 hover:bg-green-600">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Registered
                        </Button>
                      ) : registrationCount >= meeting.max_participants ? (
                        <Button disabled>Meeting Full</Button>
                      ) : (
                        <form action={`/api/meetings/${meeting.id}/register`} method="POST">
                          <Button type="submit">Register for Meeting</Button>
                        </form>
                      )}

                      {(isRegistered || isHost) && meeting.meeting_url && (
                        <Button asChild variant="outline">
                          <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-2" />
                            Join Meeting
                          </a>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Meeting Details */}
          <div className="lg:col-span-2 space-y-6">
            {meeting.description && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>About This Meeting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-foreground">{meeting.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Meeting Access Info */}
            {(isRegistered || isHost) && (
              <Card className="border-border/50 bg-gradient-to-r from-accent/5 to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-accent" />
                    Meeting Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {meeting.meeting_url && (
                    <div>
                      <Label className="text-sm font-medium">Meeting Link</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-muted rounded text-sm">{meeting.meeting_url}</code>
                        <Button size="sm" variant="outline" asChild>
                          <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {meeting.meeting_id && (
                    <div>
                      <Label className="text-sm font-medium">Meeting ID</Label>
                      <code className="block p-2 bg-muted rounded text-sm mt-1">{meeting.meeting_id}</code>
                    </div>
                  )}

                  {meeting.password && (
                    <div>
                      <Label className="text-sm font-medium">Password</Label>
                      <code className="block p-2 bg-muted rounded text-sm mt-1">{meeting.password}</code>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Registered Participants */}
            {meeting.meeting_registrations && meeting.meeting_registrations.length > 0 && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Registered Participants ({registrationCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {meeting.meeting_registrations.map((registration) => (
                      <div
                        key={registration.id}
                        className="flex items-center gap-3 p-3 border border-border/50 rounded-lg"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={registration.profiles?.profile_image_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {registration.profiles?.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{registration.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Registered {new Date(registration.registered_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Host Information */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Meeting Host</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={meeting.profiles?.profile_image_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {meeting.profiles?.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold">{meeting.profiles?.full_name}</h4>
                    {meeting.profiles?.current_position && meeting.profiles?.current_company && (
                      <p className="text-sm text-muted-foreground">
                        {meeting.profiles.current_position} at {meeting.profiles.current_company}
                      </p>
                    )}
                    {meeting.profiles?.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{meeting.profiles.bio}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                      {meeting.profiles?.linkedin_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={meeting.profiles.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meeting Summary */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Meeting Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm font-medium">{date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time</span>
                  <span className="text-sm font-medium">{time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">{meeting.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Capacity</span>
                  <span className="text-sm font-medium">
                    {registrationCount}/{meeting.max_participants}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(meeting.meeting_date)}`}>
                    {getStatusText(meeting.meeting_date)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
