import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Calendar, Clock, Users, Video, Plus, UserCheck } from "lucide-react"

export default async function MeetingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Fetch upcoming meetings with host information and registration count
  const { data: upcomingMeetings } = await supabase
    .from("meetings")
    .select(`
      *,
      profiles:host_id (
        full_name,
        current_company,
        current_position,
        profile_image_url
      ),
      meeting_registrations (
        id,
        user_id
      )
    `)
    .eq("is_active", true)
    .gte("meeting_date", new Date().toISOString())
    .order("meeting_date", { ascending: true })

  // Fetch past meetings
  const { data: pastMeetings } = await supabase
    .from("meetings")
    .select(`
      *,
      profiles:host_id (
        full_name,
        current_company,
        profile_image_url
      ),
      meeting_registrations (
        id
      )
    `)
    .eq("is_active", true)
    .lt("meeting_date", new Date().toISOString())
    .order("meeting_date", { ascending: false })
    .limit(5)

  // Check user's registrations
  const { data: userRegistrations } = await supabase
    .from("meeting_registrations")
    .select("meeting_id")
    .eq("user_id", user.id)

  const registeredMeetingIds = new Set(userRegistrations?.map((r) => r.meeting_id) || [])

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

    if (diffHours < 1) return "bg-red-500/10 text-red-700 border-red-200"
    if (diffHours < 24) return "bg-orange-500/10 text-orange-700 border-orange-200"
    return "bg-green-500/10 text-green-700 border-green-200"
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calendar className="h-8 w-8 text-accent" />
              Virtual Meetings
            </h1>
            <p className="text-muted-foreground mt-2">
              Join networking sessions, mentorship meetings, and knowledge sharing events.
            </p>
          </div>
          {profile.role === "alumni" && (
            <Button asChild>
              <Link href="/dashboard/meetings/schedule">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Link>
            </Button>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Upcoming Meetings</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingMeetings && upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => {
                const { date, time } = formatDateTime(meeting.meeting_date)
                const isRegistered = registeredMeetingIds.has(meeting.id)
                const registrationCount = meeting.meeting_registrations?.length || 0

                return (
                  <Card
                    key={meeting.id}
                    className="border-border/50 hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-sm"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold">{meeting.title}</h3>
                            <Badge variant="outline" className={`text-xs ${getStatusColor(meeting.meeting_date)}`}>
                              {new Date(meeting.meeting_date) < new Date() ? "Live" : "Upcoming"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {registrationCount}/{meeting.max_participants}
                            </span>
                          </div>

                          {meeting.description && (
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{meeting.description}</p>
                          )}

                          <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={meeting.profiles?.profile_image_url || "/placeholder.svg"} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {meeting.profiles?.full_name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{meeting.profiles?.full_name}</p>
                              {meeting.profiles?.current_position && meeting.profiles?.current_company && (
                                <p className="text-xs text-muted-foreground">
                                  {meeting.profiles.current_position} at {meeting.profiles.current_company}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {isRegistered ? (
                              <Button variant="outline" className="flex-1 bg-transparent" disabled>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Registered
                              </Button>
                            ) : (
                              <Button asChild className="flex-1">
                                <Link href={`/dashboard/meetings/${meeting.id}`}>Register</Link>
                              </Button>
                            )}
                            <Button asChild variant="outline">
                              <Link href={`/dashboard/meetings/${meeting.id}`}>View Details</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })
            ) : (
              <div className="col-span-full text-center py-16">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Meetings</h3>
                <p className="text-muted-foreground mb-6">
                  There are no scheduled meetings at the moment. Check back later for new sessions.
                </p>
                {profile.role === "alumni" && (
                  <Button asChild>
                    <Link href="/dashboard/meetings/schedule">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule the First Meeting
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Past Meetings */}
        {pastMeetings && pastMeetings.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Recent Meetings</h2>
            <div className="space-y-4">
              {pastMeetings.map((meeting) => {
                const { date, time } = formatDateTime(meeting.meeting_date)
                const registrationCount = meeting.meeting_registrations?.length || 0

                return (
                  <Card key={meeting.id} className="border-border/50 bg-muted/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={meeting.profiles?.profile_image_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {meeting.profiles?.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{meeting.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Hosted by {meeting.profiles?.full_name}</span>
                              <span>
                                {date} at {time}
                              </span>
                              <span>{registrationCount} attendees</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          Completed
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Meeting Stats */}
        <Card className="border-border/50 bg-gradient-to-r from-accent/5 via-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-accent" />
              Meeting Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{upcomingMeetings?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {upcomingMeetings?.reduce((sum, m) => sum + (m.meeting_registrations?.length || 0), 0) || 0}
                </div>
                <p className="text-sm text-muted-foreground">Total Registrations</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{pastMeetings?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{registeredMeetingIds.size}</div>
                <p className="text-sm text-muted-foreground">Your Registrations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
