import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle2, Briefcase, Loader2, Terminal, Code2, FileText, Lightbulb, XCircle } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
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
  questionTitle?: string;
  expectedOutput?: string;
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
  return "python";
};

const QuestionDetail = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, currentUser } = useAuth();
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("question");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [output, setOutput] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [textOutput, setTextOutput] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{ passed: boolean; message?: string } | null>(null);
  const [editorHeight, setEditorHeight] = useState(600);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [questionId]);

  // Calculate editor height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      // Calculate height: viewport height - header (~100px) - editor header (60px) - padding (32px)
      const height = Math.max(500, window.innerHeight - 192);
      setEditorHeight(height);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Fetch question
  useEffect(() => {
    if (!questionId) {
      toast({
        title: "Question not found",
        description: "Invalid question ID.",
        variant: "destructive",
      });
      navigate("/interview-prep");
      return;
    }

    const questionRef = doc(db, "interviewQuestions", questionId);
    const unsubscribe = onSnapshot(
      questionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setQuestion({
            id: snapshot.id,
            question: data.question,
            answer: data.answer,
            tier: data.tier ?? "free",
            createdAt: data.createdAt?.toDate?.(),
            title: data.title,
            questionTitle: data.questionTitle,
            expectedOutput: data.expectedOutput,
            difficulty: data.difficulty,
            company: data.company,
          } as InterviewQuestion);
        } else {
          toast({
            title: "Question not found",
            description: "The question you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate("/interview-prep");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching question:", error);
        toast({
          title: "Unable to load question",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [questionId, navigate, toast]);

  // Check if question is completed
  useEffect(() => {
    if (!currentUser || !questionId) {
      setIsCompleted(false);
      return;
    }

    const submissionRef = doc(db, "userQuestionSubmissions", `${currentUser.uid}_${questionId}`);
    const unsubscribe = onSnapshot(
      submissionRef,
      (snapshot) => {
        if (snapshot.exists() && snapshot.data().status === "completed") {
          setIsCompleted(true);
        } else {
          setIsCompleted(false);
        }
      },
      (error) => {
        console.error("Error checking completion:", error);
      }
    );

    return unsubscribe;
  }, [currentUser, questionId]);

  const moduleTitle = question?.title || "General";
  const language = detectLanguage(moduleTitle);
  const canViewPaid = Boolean(profile?.isPaid);

  const handleShowSolution = () => {
    if (!currentUser) {
      setAuthMode("signup");
      setAuthModalOpen(true);
      return;
    }
    setActiveTab("solution");
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading question…</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return null;
  }

  // Check if user can view this question
  if (question.tier === "paid" && !canViewPaid) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 lg:px-6 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" className="px-0" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="p-12 text-center border border-border rounded-lg bg-card">
            <div className="max-w-md mx-auto space-y-4">
              <div className="inline-flex p-4 rounded-full bg-muted/50">
                <Terminal className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold">Premium Question</h2>
              <p className="text-muted-foreground">
                This is a premium question. Upgrade your account to access it.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-screen flex flex-col">
        {/* Header with Back button and Language badge */}
        <div className="px-4 lg:px-6 py-3 border-b border-border/50 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <Button 
              variant="ghost" 
              className="px-3 hover:bg-muted/50 transition-colors" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Module</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                {question.company && (
                  <Badge 
                    variant="secondary" 
                    className="gap-1.5 px-3 py-1 text-sm font-medium bg-secondary/20"
                  >
                    <CompanyLogo companyName={question.company} size={14} className="flex-shrink-0" />
                    {question.company}
                  </Badge>
                )}
                {question.difficulty && (
                  <Badge
                    variant="outline"
                    className={`gap-1.5 px-3 py-1 text-sm font-medium ${
                      question.difficulty === "easy"
                        ? "border-green-500/60 text-green-400 bg-green-500/15"
                        : question.difficulty === "medium"
                        ? "border-yellow-500/60 text-yellow-400 bg-yellow-500/15"
                        : "border-red-500/60 text-red-400 bg-red-500/15"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                  </Badge>
                )}
                {isCompleted && (
                  <Badge 
                    variant="default" 
                    className="gap-1.5 px-3 py-1 text-sm font-medium bg-green-500/20 text-green-400 border-green-500/50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Completed
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="gap-2 px-3 py-1.5 border-primary/30 bg-primary/5">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-primary">{language.toUpperCase()}</span>
              </Badge>
            </div>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold mt-3">
            {question.questionTitle || "Interview Question"}
          </h1>
        </div>

        {/* Main content: Three-column layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[400px,1fr,350px] overflow-hidden">
          {/* Left Panel: Question */}
          <div className="flex flex-col h-full overflow-hidden border-r border-border/50 bg-background">
            <div className="p-4 border-b border-border/50">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="question" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Question
                  </TabsTrigger>
                  <TabsTrigger 
                    value="solution" 
                    onClick={handleShowSolution}
                    disabled={!currentUser}
                    className="flex-1"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Solution
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="question" className="mt-0">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 space-y-3">
                    {question.question.split('\n').map((line, idx) => (
                      <p key={idx} className="mb-2 last:mb-0">
                        {line || '\u00A0'}
                      </p>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="solution" className="mt-0">
                  {currentUser ? (
                    <div className="rounded-lg bg-muted/30 border border-border/50 p-4">
                      <pre className="text-xs text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                        {question.answer}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
                      <div className="p-4 rounded-full bg-muted/50">
                        <Lightbulb className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Sign in to view the solution</p>
                      <Button onClick={() => setAuthModalOpen(true)} size="sm">
                        Sign In
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Middle Panel: Code Editor */}
          <div className="flex flex-col h-full overflow-hidden border-r border-border/50 bg-background">
            {currentUser ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border/50 bg-muted/20 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Code Editor</span>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden p-4 flex flex-col min-h-0">
                  <CodeEditor
                    language={language}
                    question={question.question}
                    questionId={question.id}
                    height={`${editorHeight}px`}
                    expectedOutput={question.expectedOutput}
                    hideOutput={true}
                    onOutputChange={(out, textOut) => {
                      setOutput(out);
                      setTextOutput(textOut);
                    }}
                    onValidationChange={(result) => {
                      setValidationResult(result);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8">
                <div className="p-5 rounded-full bg-primary/10 border-2 border-primary/20">
                  <Code2 className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-foreground font-semibold">Start Coding Now</p>
                  <p className="text-sm text-muted-foreground">
                    Sign in to access the interactive code editor
                  </p>
                </div>
                <Button onClick={() => setAuthModalOpen(true)} size="lg">
                  Sign In to Continue
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel: Output */}
          <div className="flex flex-col h-full overflow-hidden bg-background">
            <div className="p-4 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Output</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {validationResult && (
                <div className={`mb-4 rounded-lg border-2 p-3 ${
                  validationResult.passed 
                    ? "border-green-500/60 bg-green-500/10" 
                    : "border-red-500/60 bg-red-500/10"
                }`}>
                  <div className="flex items-center gap-2">
                    {validationResult.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-xs font-semibold ${
                      validationResult.passed ? "text-green-400" : "text-red-400"
                    }`}>
                      {validationResult.passed ? "✓ Correct!" : "✗ Incorrect"}
                    </span>
                  </div>
                  {validationResult.message && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {validationResult.message}
                    </p>
                  )}
                </div>
              )}
              
              {output && output.columns.length > 0 && output.values.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        {output.columns.map((col, idx) => (
                          <th key={idx} className="px-3 py-2 text-left font-semibold text-foreground">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {output.values.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-border/30 hover:bg-muted/20">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-3 py-2 text-foreground/90">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : textOutput ? (
                <div className="rounded-lg bg-muted/30 border border-border/50 p-3">
                  <pre className="text-xs text-foreground/90 font-mono whitespace-pre-wrap overflow-x-auto">
                    {textOutput}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <p className="text-sm text-muted-foreground">Run code to see output</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode={authMode}
      />
    </div>
  );
};

export default QuestionDetail;

