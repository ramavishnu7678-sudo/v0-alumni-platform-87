import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Briefcase, Search, MapPin, Building, Clock, DollarSign, Plus, ExternalLink, Filter } from "lucide-react"

export default async function JobsPage() {
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

  const { data: jobs } = await supabase
    .from("jobs")
    .select(`
      *,
      profiles:posted_by (
        full_name,
        current_company
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" />
              Job Opportunities
            </h1>
            <p className="text-muted-foreground mt-2">Discover career opportunities shared by our alumni network.</p>
          </div>
          {profile.role === "alumni" && (
            <Button asChild>
              <Link href="/dashboard/jobs/post">
                <Plus className="h-4 w-4 mr-2" />
                Post Job
              </Link>
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Find Your Next Opportunity</CardTitle>
            <CardDescription>Search and filter jobs by title, company, location, or type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search jobs by title, company, or location..." className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Grid */}
        <div className="space-y-6">
          {jobs && jobs.length > 0 ? (
            jobs.map((job) => (
              <Card
                key={job.id}
                className="border-border/50 hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <Badge variant="outline" className={`text-xs ${getJobTypeColor(job.job_type)}`}>
                          {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getExperienceColor(job.experience_level)}`}>
                          {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                        {job.salary_range && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary_range}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{job.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Posted by {job.profiles?.full_name}
                          {job.profiles?.current_company && ` from ${job.profiles.current_company}`}
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/jobs/${job.id}`}>View Details</Link>
                          </Button>
                          {job.application_url && (
                            <Button asChild size="sm">
                              <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Apply Now
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Job Opportunities Available</h3>
              <p className="text-muted-foreground mb-6">
                There are no job postings at the moment. Check back later for new opportunities.
              </p>
              {profile.role === "alumni" && (
                <Button asChild>
                  <Link href="/dashboard/jobs/post">
                    <Plus className="h-4 w-4 mr-2" />
                    Post the First Job
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Job Stats */}
        <Card className="border-border/50 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Job Market Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {jobs?.filter((j) => j.job_type === "full-time").length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Full-time</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {jobs?.filter((j) => j.job_type === "internship").length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Internships</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {jobs?.filter((j) => j.experience_level === "entry").length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Entry Level</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{new Set(jobs?.map((j) => j.company)).size || 0}</div>
                <p className="text-sm text-muted-foreground">Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
