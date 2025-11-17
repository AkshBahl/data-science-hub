import { useEffect, useMemo, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Layers } from "lucide-react";
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
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Interview Preparation Hub
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Pick a topic to dive into curated free and premium questions. Each module contains real interview prompts
            vetted by our mentors.
          </p>
        </div>

        <GlassCard className="p-6 flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">Question modules</p>
            <h2 className="text-3xl font-bold">
              {moduleSummaries.length} {moduleSummaries.length === 1 ? "topic" : "topics"} ready to explore
            </h2>
            <p className="text-muted-foreground">
              Click any module to view all free questions (and premium ones if your account is upgraded).
            </p>
          </div>
          <Layers className="h-14 w-14 text-primary/60" />
        </GlassCard>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading modules…</p>
        ) : moduleSummaries.length === 0 ? (
          <GlassCard className="text-center py-10">
            <p className="text-lg font-semibold mb-2">No question modules yet</p>
            <p className="text-sm text-muted-foreground">
              As soon as the first question is published, you&apos;ll see it here.
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {moduleSummaries.map((module) => (
              <GlassCard
                key={module.title}
                className="p-6 space-y-3 cursor-pointer hover:border-primary/60 transition"
                onClick={() => handleOpenModule(module.title)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{module.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {module.freeCount} free · {module.premiumCount} premium
                    </p>
                  </div>
                  <Badge variant="secondary">{module.total} Q</Badge>
                </div>
                <Button variant="ghost" className="px-0 text-primary" onClick={() => handleOpenModule(module.title)}>
                  Browse module →
                </Button>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPrep;