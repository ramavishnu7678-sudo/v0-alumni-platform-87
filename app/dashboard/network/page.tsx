"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Users, Search, Building, Calendar, Linkedin, Mail, GraduationCap } from "lucide-react"

export default function NetworkPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        setUser(user)

        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .neq("id", user.id)
          .order("created_at", { ascending: false })

        setProfiles(profilesData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Alumni Network
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect with fellow alumni and current students from Meenakshi College of Engineering.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Find Alumni & Students</CardTitle>
            <CardDescription>Search by name, department, graduation year, or company</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, company, or department..." className="pl-10" />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
          </CardContent>
        </Card>

        {/* Network Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles && profiles.length > 0 ? (
            profiles.map((profile) => (
              <Card
                key={profile.id}
                className="border-border/50 hover:shadow-lg transition-all duration-300 bg-card/80 backdrop-blur-sm"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile.profile_image_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {profile.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{profile.full_name}</h3>
                      <Badge variant="outline" className={`text-xs ${getRoleColor(profile.role)} mb-2`}>
                        {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                      </Badge>
                      {profile.current_position && profile.current_company && (
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.current_position} at {profile.current_company}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.department && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span className="truncate">{profile.department}</span>
                    </div>
                  )}

                  {profile.graduation_year && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Class of {profile.graduation_year}</span>
                    </div>
                  )}

                  {profile.current_company && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span className="truncate">{profile.current_company}</span>
                    </div>
                  )}

                  {profile.bio && <p className="text-sm text-muted-foreground line-clamp-3">{profile.bio}</p>}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        (window.location.href = `mailto:${profile.email}?subject=Connection Request from ${user?.email}&body=Hi ${profile.full_name},%0D%0A%0D%0AI would like to connect with you through the Meenakshi College of Engineering Alumni Platform.%0D%0A%0D%0ABest regards`)
                      }
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                    {profile.linkedin_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Network Members Found</h3>
              <p className="text-muted-foreground">There are no alumni or students in the network yet.</p>
            </div>
          )}
        </div>

        {/* Network Stats */}
        <Card className="border-border/50 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Network Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {profiles?.filter((p) => p.role === "alumni").length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Alumni</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {profiles?.filter((p) => p.role === "student").length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {new Set(profiles?.map((p) => p.department).filter(Boolean)).size || 0}
                </div>
                <p className="text-sm text-muted-foreground">Departments</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {new Set(profiles?.map((p) => p.current_company).filter(Boolean)).size || 0}
                </div>
                <p className="text-sm text-muted-foreground">Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
