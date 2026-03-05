"use client"

import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Users, Search, CheckCircle, XCircle, Eye, ArrowLeft, Calendar, Building, Mail } from "lucide-react"
import Link from "next/link"

interface Profile {
  id: string
  email: string
  full_name: string
  role: "admin" | "alumni" | "student"
  graduation_year?: number
  department?: string
  current_company?: string
  current_position?: string
  is_approved: boolean
  created_at: string
  profile_image_url?: string
}

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isApproving, setIsApproving] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAndFetchUsers = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (!profile || profile.role !== "admin") {
        router.push("/dashboard")
        return
      }

      // Fetch all profiles
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching profiles:", error)
      } else {
        setProfiles(profilesData || [])
        setFilteredProfiles(profilesData || [])
      }
      setIsLoading(false)
    }

    checkAdminAndFetchUsers()
  }, [router, supabase])

  useEffect(() => {
    let filtered = profiles

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (profile) =>
          profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.current_company?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((profile) => profile.role === roleFilter)
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((profile) =>
        statusFilter === "approved" ? profile.is_approved : !profile.is_approved,
      )
    }

    setFilteredProfiles(filtered)
  }, [profiles, searchTerm, roleFilter, statusFilter])

  const handleApproveUser = async (userId: string) => {
    setIsApproving(userId)
    try {
      const { error } = await supabase.from("profiles").update({ is_approved: true }).eq("id", userId)

      if (error) throw error

      // Update local state
      setProfiles((prev) =>
        prev.map((profile) => (profile.id === userId ? { ...profile, is_approved: true } : profile)),
      )
    } catch (error) {
      console.error("Error approving user:", error)
    } finally {
      setIsApproving(null)
    }
  }

  const handleRejectUser = async (userId: string) => {
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", userId)

      if (error) throw error

      // Update local state
      setProfiles((prev) => prev.filter((profile) => profile.id !== userId))
    } catch (error) {
      console.error("Error rejecting user:", error)
    }
  }

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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button asChild variant="ghost" className="mb-4">
              <Link href="/dashboard/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin Panel
              </Link>
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-2">Review and manage user accounts, approvals, and permissions.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{profiles.length}</div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{profiles.filter((p) => p.is_approved).length}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">{profiles.filter((p) => !p.is_approved).length}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">
                {profiles.filter((p) => p.role === "alumni").length}
              </div>
              <p className="text-sm text-muted-foreground">Alumni</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter Users</CardTitle>
            <CardDescription>Find users by name, email, department, or company</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="border-border/50 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile.profile_image_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {profile.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{profile.full_name}</h3>
                        <Badge variant="outline" className={`text-xs ${getRoleColor(profile.role)}`}>
                          {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                        </Badge>
                        <Badge variant={profile.is_approved ? "default" : "secondary"} className="text-xs">
                          {profile.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {profile.email}
                          </div>
                          {profile.graduation_year && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Class of {profile.graduation_year}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          {profile.department && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              {profile.department}
                            </div>
                          )}
                          {profile.current_company && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              {profile.current_position} at {profile.current_company}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        Registered {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!profile.is_approved && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(profile.id)}
                          disabled={isApproving === profile.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isApproving === profile.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject User Registration</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to reject {profile.full_name}'s registration? This will
                                permanently delete their account and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRejectUser(profile.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Reject User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredProfiles.length === 0 && (
            <div className="text-center py-16">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search criteria."
                  : "No users have registered yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
