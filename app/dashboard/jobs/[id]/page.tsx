import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { MapPin, Building, Clock, DollarSign, ExternalLink, Mail, ArrowLeft, User } from "lucide-react"

interface JobPageProps {
  params: Promise<{ id: string }>
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch job with poster information
  const { data: job } = await supabase
    .from("jobs")
    .select(`
      *,
      profiles:posted_by (
        full_name,
        current_company,
        current_position,
        profile_image_url,
        linkedin_url
      )
    `)
    .eq("id", id)
    .eq("is_approved", true)
    .eq("is_active", true)
    .single()

  if (!job) {
    notFound()
  }

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case "full-time":
        return "bg-green-500/10 text-green-700 border-green-200"
      case "part-time":
        return "bg-blue-500/10 text-blue-700 border-blue-200"
      case "internship":
        return "bg-purple-500/10 text-purple-700 border-purple-200"
      case "contract":
        return "bg-orange-500/10 text-orange-700 border-orange-200"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getExperienceColor = (level: string) => {
    switch (level) {
      case "entry":
        return "bg-blue-500/10 text-blue-700 border-blue-200"
      case "mid":
        return "bg-primary/10 text-primary border-primary/20"
      case "senior":
        return "bg-orange-500/10 text-orange-700 border-orange-200"
      case "executive":
        return "bg-red-500/10 text-red-700 border-red-200"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/dashboard/jobs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
        </Button>

        {/* Job Header */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold">{job.title}</h1>
                  <Badge variant="outline" className={`${getJobTypeColor(job.job_type)}`}>
                    {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                  </Badge>
                  <Badge variant="outline" className={`${getExperienceColor(job.experience_level)}`}>
                    {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
                  </Badge>
                </div>

                <div className="flex items-center gap-6 text-muted-foreground mb-4">
                  <span className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    <span className="font-medium">{job.company}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {job.location}
                  </span>
                  {job.salary_range && (
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      {job.salary_range}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-4">
                  {job.application_url && (
                    <Button asChild size="lg">
                      <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apply Now
                      </a>
                    </Button>
                  )}
                  {job.contact_email && (
                    <Button asChild variant="outline" size="lg">
                      <a href={`mailto:${job.contact_email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Recruiter
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-foreground">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-foreground">{job.requirements}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Posted By */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Posted By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={job.profiles?.profile_image_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {job.profiles?.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold">{job.profiles?.full_name}</h4>
                    {job.profiles?.current_position && job.profiles?.current_company && (
                      <p className="text-sm text-muted-foreground">
                        {job.profiles.current_position} at {job.profiles.current_company}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <User className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                      {job.profiles?.linkedin_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={job.profiles.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Summary */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Job Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Job Type</span>
                  <Badge variant="outline" className={`text-xs ${getJobTypeColor(job.job_type)}`}>
                    {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Experience</span>
                  <Badge variant="outline" className={`text-xs ${getExperienceColor(job.experience_level)}`}>
                    {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-medium">{job.location}</span>
                </div>
                {job.salary_range && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Salary</span>
                    <span className="text-sm font-medium">{job.salary_range}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Posted</span>
                  <span className="text-sm font-medium">{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Application Actions */}
            <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4">Ready to Apply?</h4>
                <div className="space-y-3">
                  {job.application_url && (
                    <Button asChild className="w-full">
                      <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apply Online
                      </a>
                    </Button>
                  )}
                  {job.contact_email && (
                    <Button asChild variant="outline" className="w-full bg-transparent">
                      <a href={`mailto:${job.contact_email}?subject=Application for ${job.title}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email Recruiter
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
