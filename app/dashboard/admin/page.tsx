import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Shield, Users, Briefcase, Calendar, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch pending approvals
  const { data: pendingProfiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_approved", false)
    .order("created_at", { ascending: false })

  const { data: pendingJobs } = await supabase
    .from("jobs")
    .select(`
      *,
      profiles:posted_by (
        full_name,
        current_company
      )
    `)
    .eq("is_approved", false)
    .order("created_at", { ascending: false })

  // Fetch stats
  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  const { count: approvedUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_approved", true)

  const { count: totalJobs } = await supabase.from("jobs").select("*", { count: "exact", head: true })

  const { count: approvedJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("is_approved", true)

  const { count: totalMeetings } = await supabase
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  const { count: upcomingMeetings } = await supabase
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .gte("meeting_date", new Date().toISOString())

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-700 border-red-200"
      case "alumni":
        return "bg-primary/10 text-primary border-primary/20"
      case "student":
        return "bg-blue-500/10 text-blue-700 border-blue-200"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-600" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts, approve content, and oversee platform activities.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">{approvedUsers || 0} approved</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Job Postings</CardTitle>
              <Briefcase className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalJobs || 0}</div>
              <p className="text-xs text-muted-foreground">{approvedJobs || 0} approved</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-accent/5 to-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{totalMeetings || 0}</div>
              <p className="text-xs text-muted-foreground">{upcomingMeetings || 0} upcoming</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(pendingProfiles?.length || 0) + (pendingJobs?.length || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-border/50 bg-gradient-to-r from-red-500/5 via-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              Admin Actions
            </CardTitle>
            <CardDescription>Quick access to common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 bg-transparent">
                <Link href="/dashboard/admin/users">
                  <Users className="h-6 w-6" />
                  <span>Manage Users</span>
                  {pendingProfiles && pendingProfiles.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {pendingProfiles.length} pending
                    </Badge>
                  )}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 bg-transparent">
                <Link href="/dashboard/admin/jobs">
                  <Briefcase className="h-6 w-6" />
                  <span>Manage Jobs</span>
                  {pendingJobs && pendingJobs.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {pendingJobs.length} pending
                    </Badge>
                  )}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 bg-transparent">
                <Link href="/dashboard/admin/meetings">
                  <Calendar className="h-6 w-6" />
                  <span>Manage Meetings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending User Approvals */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Pending User Approvals
                </CardTitle>
                <CardDescription>New user registrations awaiting approval</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/users">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingProfiles && pendingProfiles.length > 0 ? (
                pendingProfiles.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${getRoleColor(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                          {user.graduation_year && (
                            <span className="text-xs text-muted-foreground">Class of {user.graduation_year}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending user approvals</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Job Approvals */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Pending Job Approvals
                </CardTitle>
                <CardDescription>Job postings awaiting review and approval</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/admin/jobs">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingJobs && pendingJobs.length > 0 ? (
                pendingJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="p-4 border border-border/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{job.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {job.company} • {job.location}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {job.job_type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Posted by {job.profiles?.full_name} • {new Date(job.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending job approvals</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Platform Activity
            </CardTitle>
            <CardDescription>Latest user registrations, job postings, and meeting schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent Users */}
              {pendingProfiles &&
                pendingProfiles.slice(0, 3).map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{user.full_name}</span> registered as {user.role}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Pending
                    </Badge>
                  </div>
                ))}

              {/* Recent Jobs */}
              {pendingJobs &&
                pendingJobs.slice(0, 2).map((job) => (
                  <div key={job.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{job.profiles?.full_name}</span> posted "{job.title}" at{" "}
                        {job.company}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(job.created_at).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Pending
                    </Badge>
                  </div>
                ))}

              {(!pendingProfiles || pendingProfiles.length === 0) && (!pendingJobs || pendingJobs.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity to display</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
