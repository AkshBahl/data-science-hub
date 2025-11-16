import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Blog = () => {
  const posts = [
    {
      title: "10 Essential SQL Queries Every Data Scientist Should Know",
      excerpt: "Master these fundamental SQL queries to boost your data analysis skills and interview performance...",
      category: "SQL",
      readTime: "8 min",
      date: "Jan 15, 2024",
      featured: true,
    },
    {
      title: "Understanding Machine Learning Model Evaluation Metrics",
      excerpt: "A comprehensive guide to choosing the right metrics for your ML models, from accuracy to F1-score...",
      category: "Machine Learning",
      readTime: "12 min",
      date: "Jan 10, 2024",
      featured: true,
    },
    {
      title: "Data Cleaning Techniques in Python: A Practical Guide",
      excerpt: "Learn effective strategies for handling missing values, outliers, and data inconsistencies...",
      category: "Python",
      readTime: "10 min",
      date: "Jan 5, 2024",
      featured: false,
    },
    {
      title: "Career Path: From Beginner to Data Scientist in 2024",
      excerpt: "A roadmap for aspiring data scientists with actionable steps and realistic timelines...",
      category: "Career",
      readTime: "15 min",
      date: "Dec 28, 2023",
      featured: false,
    },
    {
      title: "Feature Engineering Best Practices",
      excerpt: "Discover advanced techniques to create powerful features that improve model performance...",
      category: "Machine Learning",
      readTime: "14 min",
      date: "Dec 20, 2023",
      featured: false,
    },
  ];

  const categories = ["All", "SQL", "Python", "Machine Learning", "Statistics", "Career"];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-up">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Blog
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Insights, tutorials, and career advice for data science professionals
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={category === "All" ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/20 transition-colors px-4 py-2"
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Featured Posts */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Posts</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {posts.filter(post => post.featured).map((post, index) => (
              <GlassCard key={index} className="group cursor-pointer hover:border-primary/50">
                <div className="h-48 bg-gradient-subtle rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-6xl">📝</div>
                </div>
                <Badge className="mb-3 bg-primary">{post.category}</Badge>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>{post.date}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <Link to="#" className="flex items-center gap-2 text-primary hover:gap-3 transition-all">
                    Read More
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* All Posts */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Posts</h2>
          <div className="space-y-6">
            {posts.filter(post => !post.featured).map((post, index) => (
              <GlassCard key={index} className="group cursor-pointer hover:border-primary/50">
                <div className="flex gap-6">
                  <div className="w-32 h-32 bg-gradient-subtle rounded-lg flex-shrink-0 flex items-center justify-center">
                    <div className="text-4xl">📄</div>
                  </div>
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">{post.category}</Badge>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground mb-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>{post.date}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      <Link to="#" className="flex items-center gap-2 text-primary hover:gap-3 transition-all">
                        Read More
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;