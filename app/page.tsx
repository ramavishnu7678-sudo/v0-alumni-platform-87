import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { GraduationCap, Users, Briefcase, Calendar, Award, Network, Sparkles, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="p-4 bg-primary rounded-2xl shadow-lg">
              <GraduationCap className="h-12 w-12 text-primary-foreground" />
            </div>
            <Sparkles className="h-8 w-8 text-accent animate-pulse" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-balance mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
            Alumni Association
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto text-balance">
            Meenakshi College of Engineering
          </p>

          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty">
            Connect with fellow alumni, discover career opportunities, and build lasting professional relationships in
            our exclusive network.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Link href="/auth/register" className="flex items-center gap-2">
                Join Network
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 font-semibold bg-transparent"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-balance">Everything You Need to Stay Connected</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Our platform brings together alumni and students with powerful tools for networking, career growth, and
              knowledge sharing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Alumni Network</CardTitle>
                <CardDescription>
                  Connect with thousands of alumni across different industries and graduation years.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="p-3 bg-accent/10 rounded-lg w-fit">
                  <Briefcase className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-xl">Job Opportunities</CardTitle>
                <CardDescription>
                  Discover exclusive job postings shared by alumni and access career opportunities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Virtual Meetings</CardTitle>
                <CardDescription>
                  Join Google Meet sessions for mentorship, networking, and knowledge sharing.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="p-3 bg-accent/10 rounded-lg w-fit">
                  <Award className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-xl">Mentorship</CardTitle>
                <CardDescription>
                  Get guidance from experienced alumni or mentor current students in your field.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit">
                  <Network className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Professional Growth</CardTitle>
                <CardDescription>
                  Access resources, workshops, and networking events to advance your career.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="p-3 bg-accent/10 rounded-lg w-fit">
                  <Sparkles className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-xl">Exclusive Access</CardTitle>
                <CardDescription>
                  Join an exclusive community with verified alumni and current students only.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-border/50 shadow-2xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 backdrop-blur-sm">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-4 text-balance">Ready to Join Our Alumni Community?</h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
                Take the first step towards building meaningful connections and advancing your career with fellow
                Meenakshi College of Engineering graduates.
              </p>
              <Button
                asChild
                size="lg"
                className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Link href="/auth/register" className="flex items-center gap-2">
                  Get Started Today
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
