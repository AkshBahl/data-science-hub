import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, Users, PlayCircle } from "lucide-react";

const Courses = () => {
  const courses = [
    {
      title: "Python for Data Science Masterclass",
      description: "Master Python programming for data analysis and machine learning",
      level: "Beginner",
      duration: "12 weeks",
      students: 500,
      rating: 4.9,
      price: "₹4,999",
      isFree: false,
      thumbnail: "bg-gradient-primary",
    },
    {
      title: "SQL for Data Analytics",
      description: "Complete guide to SQL for data analysis and business intelligence",
      level: "Beginner",
      duration: "8 weeks",
      students: 450,
      rating: 4.8,
      price: "Free",
      isFree: true,
      thumbnail: "bg-gradient-accent",
    },
    {
      title: "Machine Learning A-Z",
      description: "Comprehensive machine learning course with hands-on projects",
      level: "Intermediate",
      duration: "16 weeks",
      students: 350,
      rating: 4.9,
      price: "₹9,999",
      isFree: false,
      thumbnail: "bg-blue-600",
    },
    {
      title: "Statistics for Data Science",
      description: "Essential statistics concepts for data scientists",
      level: "Beginner",
      duration: "10 weeks",
      students: 400,
      rating: 4.7,
      price: "Free",
      isFree: true,
      thumbnail: "bg-purple-600",
    },
  ];

  const bundles = [
    {
      name: "Complete Data Science Bundle",
      courses: 4,
      originalPrice: "₹24,996",
      bundlePrice: "₹14,999",
      savings: "40%",
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-up">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Courses
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive courses designed to take you from beginner to advanced data scientist
          </p>
        </div>

        {/* Bundle Offer */}
        <GlassCard className="mb-12 bg-gradient-accent text-center py-8">
          <h3 className="text-2xl font-bold mb-2">🎓 Special Bundle Offer</h3>
          <p className="text-lg mb-4">
            Get all {bundles[0].courses} courses for {bundles[0].bundlePrice} (Save {bundles[0].savings}!)
          </p>
          <p className="text-sm opacity-80 mb-4">
            Original Price: <span className="line-through">{bundles[0].originalPrice}</span>
          </p>
          <Button size="lg" className="bg-background text-foreground hover:bg-background/90">
            Get Bundle Now
          </Button>
        </GlassCard>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {courses.map((course, index) => (
            <GlassCard key={index} className="flex flex-col">
              <div className={`h-48 rounded-lg mb-4 flex items-center justify-center ${course.thumbnail}`}>
                <PlayCircle className="h-16 w-16 text-white/80" />
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={course.isFree ? "secondary" : "default"}>
                  {course.level}
                </Badge>
                {course.isFree && (
                  <Badge className="bg-green-500">Free</Badge>
                )}
              </div>

              <h3 className="text-2xl font-bold mb-2">{course.title}</h3>
              <p className="text-muted-foreground mb-4 flex-grow">{course.description}</p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course.students}+</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{course.rating}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">{course.price}</span>
                <Button className="bg-gradient-primary hover:shadow-glow-primary">
                  {course.isFree ? "Enroll Free" : "Enroll Now"}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Udemy Section */}
        <GlassCard className="text-center py-12">
          <h2 className="text-3xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Also Available on Udemy
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Check out our highly-rated courses on Udemy with lifetime access and certificate of completion
          </p>
          <Button size="lg" variant="outline" className="border-primary text-primary">
            Visit Udemy Profile
          </Button>
        </GlassCard>
      </div>
    </div>
  );
};

export default Courses;