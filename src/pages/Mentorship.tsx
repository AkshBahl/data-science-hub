import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Calendar, Video, BookOpen, Award, Users, TrendingUp } from "lucide-react";

const Mentorship = () => {
  const features = [
    { icon: Video, title: "Weekly 1:1 Sessions", desc: "Personalized guidance and career advice" },
    { icon: BookOpen, title: "Custom Roadmap", desc: "Tailored learning path based on your goals" },
    { icon: Award, title: "Real Projects", desc: "Build portfolio-worthy projects" },
    { icon: TrendingUp, title: "Interview Prep", desc: "Mock interviews and feedback" },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Data Scientist at Google",
      text: "Tushar's mentorship helped me land my dream job. His practical approach and industry insights were invaluable.",
      rating: 5,
    },
    {
      name: "Rahul Verma",
      role: "ML Engineer at Amazon",
      text: "The personalized guidance and project-based learning accelerated my career growth significantly.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-16 animate-fade-up">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              1:1 Mentorship Program
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Get personalized guidance from an experienced data scientist and accelerate your career
          </p>
          <Button size="lg" className="bg-gradient-accent hover:shadow-glow-secondary">
            <Calendar className="mr-2 h-5 w-5" />
            Book Free Consultation
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <GlassCard key={index} className="text-center">
                <div className="inline-flex p-4 bg-gradient-primary rounded-full mb-4">
                  <Icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </GlassCard>
            );
          })}
        </div>

        {/* What You'll Get */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              What You'll Get
            </span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <GlassCard>
              <h3 className="text-2xl font-semibold mb-4">📚 Comprehensive Learning</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>✓ Personalized learning roadmap</li>
                <li>✓ Weekly 1-hour sessions</li>
                <li>✓ Access to exclusive resources</li>
                <li>✓ Code reviews and feedback</li>
                <li>✓ Career guidance and planning</li>
              </ul>
            </GlassCard>
            <GlassCard>
              <h3 className="text-2xl font-semibold mb-4">🚀 Practical Experience</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>✓ Real-world project building</li>
                <li>✓ Portfolio development</li>
                <li>✓ Mock interviews</li>
                <li>✓ Resume and LinkedIn optimization</li>
                <li>✓ Interview preparation strategy</li>
              </ul>
            </GlassCard>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Success Stories
            </span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <GlassCard key={index}>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-lg mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <GlassCard className="text-center py-12 bg-gradient-subtle">
          <h2 className="text-3xl font-bold mb-4">Investment in Your Future</h2>
          <div className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            ₹15,000
          </div>
          <p className="text-muted-foreground mb-8">per month (3 months minimum)</p>
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              <span>Limited to 5 students per batch</span>
            </div>
          </div>
          <Button size="lg" className="bg-gradient-accent hover:shadow-glow-secondary">
            Start Your Journey
          </Button>
        </GlassCard>
      </div>
    </div>
  );
};

export default Mentorship;