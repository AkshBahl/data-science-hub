import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowLeft, Code2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import CodeEditor from "@/components/CodeEditor";
import AuthModal from "@/components/AuthModal";

type InterviewQuestion = {
  id: string;
  question: string;
  answer: string;
  tier: "free" | "paid";
  createdAt?: Date;
  title?: string;
};

// Helper function to detect language from module title
const detectLanguage = (moduleTitle: string): string => {
  const titleLower = moduleTitle.toLowerCase();
  if (titleLower.includes("python")) return "python";
  if (titleLower.includes("sql")) return "sql";
  if (titleLower.includes("javascript") || titleLower.includes("js")) return "javascript";
  if (titleLower.includes("typescript") || titleLower.includes("ts")) return "typescript";
  if (titleLower.includes("java")) return "java";
  if (titleLower.includes("c++") || titleLower.includes("cpp")) return "cpp";
  if (titleLower.includes("c#") || titleLower.includes("csharp")) return "csharp";
  if (titleLower.includes("go")) return "go";
  if (titleLower.includes("rust")) return "rust";
  // Default to python for data science questions
  return "python";
};

const DEFAULT_TITLE = "General";

const InterviewModule = () => {
  const { moduleSlug } = useParams<{ moduleSlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();

  const moduleTitle = decodeURIComponent(moduleSlug ?? DEFAULT_TITLE) || DEFAULT_TITLE;
  const canViewPaid = Boolean(profile?.isPaid);

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const questionQuery = query(collection(db, "interviewQuestions"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      questionQuery,
      (snapshot) => {
        const filtered = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              question: data.question,
              answer: data.answer,
              tier: data.tier ?? "free",
              createdAt: data.createdAt?.toDate?.(),
              title: data.title,
            };
          })
          .filter((item) => (item.title?.trim() || DEFAULT_TITLE) === moduleTitle)
          .map((item) => ({
            id: item.id,
            question: item.question,
            answer: item.answer,
            tier: item.tier,
            createdAt: item.createdAt,
            title: item.title,
          }));

        setQuestions(filtered);
        setLoading(false);
      },
      (error) => {
        console.error("Firebase error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        toast({
          title: "Unable to load questions",
          description: error.message || "Please check your Firebase security rules allow public read access.",
          variant: "destructive",
        });
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [moduleTitle, toast]);

  const freeQuestions = useMemo(() => questions.filter((q) => q.tier === "free"), [questions]);
  const premiumQuestions = useMemo(() => questions.filter((q) => q.tier === "paid"), [questions]);

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 space-y-8 max-w-5xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="px-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to modules
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-primary font-semibold">Module</p>
          <h1 className="text-4xl font-bold">{moduleTitle}</h1>
          <p className="text-muted-foreground">
            {questions.length} curated interview question{questions.length !== 1 && "s"} covering real whiteboard
            challenges and take-home assignments.
          </p>
        </div>

        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              Free questions
              <Badge variant="outline">{freeQuestions.length}</Badge>
            </h2>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : freeQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No free questions yet. Check back soon.</p>
          ) : (
            <div className="space-y-4">
              {freeQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} moduleTitle={moduleTitle} />
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              Premium questions
              <Badge variant="secondary">{premiumQuestions.length}</Badge>
            </h2>
            {!canViewPaid && (
              <Badge variant="outline" className="text-xs">
                Locked
              </Badge>
            )}
          </div>
          {canViewPaid ? (
            premiumQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No premium questions published yet.</p>
            ) : (
              <div className="space-y-4">
                {premiumQuestions.map((question) => (
                  <QuestionCard key={question.id} question={question} moduleTitle={moduleTitle} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center space-y-3 py-6">
              <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">Premium content locked</p>
              <p className="text-sm text-muted-foreground">
                Upgrade your account after payment to unlock {premiumQuestions.length} premium questions instantly.
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

const QuestionCard = ({ question, moduleTitle }: { question: InterviewQuestion; moduleTitle: string }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showCompiler, setShowCompiler] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const { currentUser } = useAuth();
  const language = detectLanguage(moduleTitle);

  const handleShowCompiler = () => {
    if (!currentUser) {
      setAuthMode("signup");
      setAuthModalOpen(true);
      return;
    }
    setShowCompiler((prev) => !prev);
  };

  const handleShowAnswer = () => {
    if (!currentUser) {
      setAuthMode("signup");
      setAuthModalOpen(true);
      return;
    }
    setShowAnswer((prev) => !prev);
  };
  
  return (
    <>
      <GlassCard className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-base font-medium whitespace-pre-wrap text-foreground/90">{question.question}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={handleShowCompiler}
              className="gap-2"
            >
              <Code2 className="h-4 w-4" />
              {showCompiler ? "Hide compiler" : "Open compiler"}
            </Button>
            <Button variant="ghost" onClick={handleShowAnswer}>
              {showAnswer ? "Hide answer" : "Show answer"}
            </Button>
          </div>
        </div>
        
        {showCompiler && currentUser && (
          <div className="mt-4">
            <CodeEditor 
              language={language}
              question={question.question}
              height="350px"
            />
          </div>
        )}
        
        {showAnswer && currentUser && (
          <div className="rounded-md bg-background/70 border border-border/70 p-4 text-sm text-muted-foreground whitespace-pre-wrap">
            {question.answer}
          </div>
        )}
      </GlassCard>
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        defaultMode={authMode}
      />
    </>
  );
};

export default InterviewModule;

