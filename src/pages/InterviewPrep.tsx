import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Lock, Search, Filter, Database, Code, Brain, BarChart } from "lucide-react";

const InterviewPrep = () => {
  const topics = [
    { name: "SQL", icon: Database, count: 50, color: "text-blue-400" },
    { name: "Python", icon: Code, count: 50, color: "text-green-400" },
    { name: "Machine Learning", icon: Brain, count: 60, color: "text-purple-400" },
    { name: "Statistics", icon: BarChart, count: 40, color: "text-orange-400" },
  ];

  const sampleQuestions = [
    {
      id: 1,
      title: "Write a SQL query to find the second highest salary",
      difficulty: "Medium",
      topic: "SQL",
      company: "Google",
      isFree: true,
    },
    {
      id: 2,
      title: "Implement K-Means clustering from scratch",
      difficulty: "Hard",
      topic: "Machine Learning",
      company: "Meta",
      isFree: true,
    },
    {
      id: 3,
      title: "Explain Central Limit Theorem with examples",
      difficulty: "Medium",
      topic: "Statistics",
      company: "Amazon",
      isFree: true,
    },
    {
      id: 4,
      title: "Optimize a Python function for large datasets",
      difficulty: "Hard",
      topic: "Python",
      company: "Netflix",
      isFree: false,
    },
    {
      id: 5,
      title: "Design a recommendation system architecture",
      difficulty: "Hard",
      topic: "Machine Learning",
      company: "Spotify",
      isFree: false,
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Interview Preparation Hub
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Master data science interviews with 200+ carefully curated questions from top tech companies
          </p>
        </div>

        {/* Topics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {topics.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <GlassCard key={index} className="text-center group cursor-pointer">
                <div className={`inline-flex p-4 bg-gradient-primary rounded-full mb-4 ${topic.color}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{topic.name}</h3>
                <p className="text-2xl font-bold text-primary">{topic.count}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </GlassCard>
            );
          })}
        </div>

        {/* Search and Filter */}
        <GlassCard className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                className="pl-10 bg-background/50"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </GlassCard>

        {/* Premium Banner */}
        <GlassCard className="mb-8 bg-gradient-accent text-center py-8">
          <h3 className="text-2xl font-bold mb-2">🎉 Special Offer</h3>
          <p className="text-lg mb-4">Get 100 questions free + 100 premium questions for just ₹999</p>
          <Button size="lg" className="bg-background text-foreground hover:bg-background/90">
            Unlock Premium
          </Button>
        </GlassCard>

        {/* Questions List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">All Questions</h2>
          {sampleQuestions.map((question) => (
            <GlassCard
              key={question.id}
              className={`relative ${!question.isFree && "opacity-75"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {question.topic}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        question.difficulty === "Easy"
                          ? "border-green-500 text-green-500"
                          : question.difficulty === "Medium"
                          ? "border-yellow-500 text-yellow-500"
                          : "border-red-500 text-red-500"
                      }
                    >
                      {question.difficulty}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {question.company}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    {question.title}
                    {!question.isFree && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </h3>
                </div>
                <Button
                  variant={question.isFree ? "default" : "outline"}
                  className={question.isFree ? "bg-gradient-primary" : ""}
                  disabled={!question.isFree}
                >
                  {question.isFree ? "Solve" : "Unlock"}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            Load More Questions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewPrep;