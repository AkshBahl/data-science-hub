import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowLeft, Code2, FileText, Lightbulb, CheckCircle2, Sparkles, Terminal, Briefcase } from "lucide-react";
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
  expectedOutput?: string; // Expected output for validation (JSON string for SQL, plain text for others)
  difficulty?: "easy" | "medium" | "hard";
  company?: string;
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
              expectedOutput: data.expectedOutput,
              difficulty: data.difficulty,
              company: data.company,
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
            expectedOutput: item.expectedOutput,
            difficulty: item.difficulty,
            company: item.company,
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
      <div className="container mx-auto px-2 lg:px-6 space-y-8 max-w-[95%] lg:max-w-7xl xl:max-w-[1600px]">
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
              {freeQuestions.map((question, index) => (
                <QuestionCard 
                  key={question.id} 
                  question={question} 
                  moduleTitle={moduleTitle}
                  questionNumber={index + 1}
                />
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
                {premiumQuestions.map((question, index) => (
                  <QuestionCard 
                    key={question.id} 
                    question={question} 
                    moduleTitle={moduleTitle}
                    questionNumber={freeQuestions.length + index + 1}
                  />
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

const QuestionCard = ({ question, moduleTitle, questionNumber }: { question: InterviewQuestion; moduleTitle: string; questionNumber: number }) => {
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
      <GlassCard className={`space-y-4 overflow-hidden ${showCompiler && currentUser ? 'p-4 lg:p-6' : 'p-4 sm:p-6'}`}>
        {/* Header with action buttons and language badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-2 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">Interview Question</h3>
                <Badge variant="outline" className="text-xs">
                  Ques {questionNumber}
                </Badge>
              </div>
              <Badge variant="secondary" className="mt-1 gap-1.5 text-xs">
                <Terminal className="h-3 w-3" />
                {language.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant={showCompiler ? "default" : "ghost"}
              onClick={handleShowCompiler}
              className="gap-2 transition-all duration-300 text-xs sm:text-sm"
              size="sm"
            >
              <Code2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{showCompiler ? "Hide compiler" : "Open compiler"}</span>
              <span className="sm:hidden">{showCompiler ? "Hide" : "Compiler"}</span>
            </Button>
            <Button 
              variant={showAnswer ? "default" : "ghost"}
              onClick={handleShowAnswer}
              className="gap-2 transition-all duration-300 text-xs sm:text-sm"
              size="sm"
            >
              {showAnswer ? (
                <>
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Hide answer</span>
                  <span className="sm:hidden">Hide</span>
                </>
              ) : (
                <>
                  <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Show answer</span>
                  <span className="sm:hidden">Answer</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Difficulty and Company badges */}
        {(question.difficulty || question.company) && (
          <div className="flex items-center gap-3 flex-wrap">
            {question.difficulty && (
              <Badge 
                variant="outline" 
                className={`gap-1.5 ${
                  question.difficulty === "easy" 
                    ? "border-green-500/50 text-green-500 bg-green-500/10" 
                    : question.difficulty === "medium"
                    ? "border-yellow-500/50 text-yellow-500 bg-yellow-500/10"
                    : "border-red-500/50 text-red-500 bg-red-500/10"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
              </Badge>
            )}
            {question.company && (
              <Badge variant="secondary" className="gap-1.5">
                <Briefcase className="h-3 w-3" />
                {question.company}
              </Badge>
            )}
          </div>
        )}

        {/* LeetCode-style layout: Question on left, Compiler on right */}
        {showCompiler && currentUser ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 relative">
            {/* Decorative divider */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent -translate-x-1/2" />
            
            {/* Left side: Question */}
            <div className="flex flex-col min-h-[400px] sm:min-h-[500px] lg:min-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-280px)] lg:h-[calc(100vh-280px)] space-y-4 overflow-hidden relative">
              {/* Gradient overlay at top */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-card/50 to-transparent z-10 pointer-events-none" />
              
              <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar">
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      Problem Statement
                    </h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-base font-medium whitespace-pre-wrap text-foreground/90 leading-relaxed">
                      {question.question}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Answer section below question if shown */}
              {showAnswer && (
                <div className="pt-4 border-t border-border/50 flex-shrink-0 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-accent/10 border border-accent/20">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Solution</h3>
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-background/80 to-background/60 border border-accent/20 p-4 text-sm text-muted-foreground whitespace-pre-wrap overflow-y-auto max-h-[250px] custom-scrollbar shadow-inner">
                    {question.answer}
                  </div>
                </div>
              )}
              
              {/* Gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/50 to-transparent z-10 pointer-events-none" />
            </div>

            {/* Right side: Code Editor */}
            <div className="flex flex-col min-h-[400px] sm:min-h-[500px] lg:min-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-280px)] lg:h-[calc(100vh-280px)] relative group">
              <div className="absolute -inset-0.5 bg-gradient-primary opacity-0 group-hover:opacity-20 rounded-lg blur transition-opacity duration-300" />
              <div className="relative flex-1 rounded-lg overflow-y-auto overflow-x-hidden border border-border/50 bg-background/30 custom-scrollbar">
                <CodeEditor
                  language={language}
                  question={question.question}
                  height="400px"
                  expectedOutput={question.expectedOutput}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Default layout when compiler is not shown */
          <div className="space-y-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Question</h3>
              </div>
              <p className="text-base font-medium whitespace-pre-wrap text-foreground/90 leading-relaxed pl-7">
                {question.question}
              </p>
            </div>
            
            {showAnswer && currentUser && (
              <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-accent/10 border border-accent/20">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Solution</h3>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-background/80 to-background/60 border border-accent/20 p-4 text-sm text-muted-foreground whitespace-pre-wrap shadow-inner">
                  {question.answer}
                </div>
              </div>
            )}
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

