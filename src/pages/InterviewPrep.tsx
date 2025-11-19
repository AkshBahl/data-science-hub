import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Layers, Sparkles, Code2, BookOpen, Target, TrendingUp, ArrowRight, Zap, Database, Brain } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type InterviewQuestion = {
  id: string;
  title?: string;
  question: string;
  tier: "free" | "paid";
};

type ModuleSummary = {
  title: string;
  total: number;
  freeCount: number;
  premiumCount: number;
};

const DEFAULT_TITLE = "General";

const InterviewPrep = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "interviewQuestions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setQuestions(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title,
              question: data.question,
              tier: data.tier ?? "free",
            } as InterviewQuestion;
          }),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Firebase error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        toast({
          title: "Unable to load question modules",
          description: error.message || "Please check your Firebase security rules allow public read access.",
          variant: "destructive",
        });
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [toast]);

  const moduleSummaries = useMemo<ModuleSummary[]>(() => {
    const map = new Map<string, ModuleSummary>();
    questions.forEach((q) => {
      const title = q.title?.trim() || DEFAULT_TITLE;
      if (!map.has(title)) {
        map.set(title, { title, total: 0, freeCount: 0, premiumCount: 0 });
      }
      const summary = map.get(title)!;
      summary.total += 1;
      if (q.tier === "free") summary.freeCount += 1;
      else summary.premiumCount += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [questions]);

  const handleOpenModule = (title: string) => {
    const slug = encodeURIComponent(title);
    navigate(`/interview-prep/module/${slug}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-4">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-block animate-fade-in">
              <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                Master Your Interview Skills
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-up">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Interview Preparation
              </span>
              <br />
              <span className="text-foreground">Hub</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Master data science interviews with curated questions, real-world problems, and expert solutions. 
              Practice with our interactive compiler and ace your next interview.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 pt-8">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{questions.length}+</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                  <Layers className="h-5 w-5 text-secondary" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">{moduleSummaries.length}</p>
                  <p className="text-sm text-muted-foreground">Modules</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-sm text-muted-foreground">Free Access</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 space-y-8">
          <GlassCard className="p-6 md:p-8 bg-gradient-subtle border-primary/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-primary">
                    <BookOpen className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">Question Modules</p>
                    <h2 className="text-3xl md:text-4xl font-bold mt-1">
                      {moduleSummaries.length} {moduleSummaries.length === 1 ? "Topic" : "Topics"} Ready
                    </h2>
                  </div>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  Click any module to explore curated interview questions. Each module contains real interview prompts 
                  with interactive coding environments and detailed solutions.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </div>
            </div>
          </GlassCard>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Loading modules…</p>
              </div>
            </div>
          ) : moduleSummaries.length === 0 ? (
            <GlassCard className="text-center py-16">
              <div className="max-w-md mx-auto space-y-4">
                <div className="inline-flex p-4 rounded-full bg-muted/50">
                  <Layers className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold">No question modules yet</h3>
                <p className="text-muted-foreground">
                  As soon as the first question is published, you&apos;ll see it here. Check back soon!
                </p>
              </div>
            </GlassCard>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {moduleSummaries.map((module, index) => {
                // Get icon based on module title
                const getModuleIcon = (title: string) => {
                  const titleLower = title.toLowerCase();
                  if (titleLower.includes("sql") || titleLower.includes("database")) return Database;
                  if (titleLower.includes("python")) return Code2;
                  if (titleLower.includes("javascript") || titleLower.includes("js")) return Code2;
                  if (titleLower.includes("machine learning") || titleLower.includes("ml")) return Brain;
                  return BookOpen;
                };
                const ModuleIcon = getModuleIcon(module.title);

                return (
                  <GlassCard
                    key={module.title}
                    className="group p-6 space-y-4 cursor-pointer hover:border-primary/60 hover:shadow-glow-primary transition-all duration-300 relative overflow-hidden"
                    onClick={() => handleOpenModule(module.title)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Decorative gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                    
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-gradient-primary group-hover:scale-110 transition-transform duration-300">
                            <ModuleIcon className="h-6 w-6 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                              {module.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {module.freeCount} Free
                              </Badge>
                              {module.premiumCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {module.premiumCount} Premium
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                          {module.total}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="text-sm text-muted-foreground">
                          {module.total} {module.total === 1 ? "question" : "questions"}
                        </span>
                        <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                          <span className="text-sm">Explore</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default InterviewPrep;