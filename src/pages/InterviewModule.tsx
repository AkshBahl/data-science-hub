import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Briefcase } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, doc, onSnapshot as onSnapshotDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type InterviewQuestion = {
  id: string;
  question: string;
  answer: string;
  tier: "free" | "paid";
  createdAt?: Date;
  title?: string;
  questionTitle?: string; // Question title (e.g., "Histogram of Tweets")
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
  const { profile, currentUser } = useAuth();

  const moduleTitle = decodeURIComponent(moduleSlug ?? DEFAULT_TITLE) || DEFAULT_TITLE;
  const canViewPaid = Boolean(profile?.isPaid);

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set());

  // Scroll to top when component mounts or module changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [moduleSlug]);

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
              questionTitle: data.questionTitle,
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
            questionTitle: item.questionTitle,
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

  // Fetch user's completed questions
  useEffect(() => {
    if (!currentUser) {
      setCompletedQuestions(new Set());
      return;
    }

    const submissionsRef = collection(db, "userQuestionSubmissions");
    const userSubmissionsQuery = query(
      collection(db, "userQuestionSubmissions"),
      orderBy("completedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      userSubmissionsQuery,
      (snapshot) => {
        const completed = new Set<string>();
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.userId === currentUser.uid && data.status === "completed") {
            completed.add(data.questionId);
          }
        });
        setCompletedQuestions(completed);
      },
      (error) => {
        console.error("Error fetching submissions:", error);
      }
    );

    return unsubscribe;
  }, [currentUser]);


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

        {/* Questions Table View */}
        {questions.length > 0 && (
          <GlassCard className="p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Questions</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => {
                    const isCompleted = completedQuestions.has(question.id);
                    return (
                      <TableRow 
                        key={question.id}
                        className="hover:bg-muted/50"
                      >
                        <TableCell>
                          {question.company ? (
                            <Badge variant="secondary" className="gap-1.5">
                              <CompanyLogo companyName={question.company} size={12} className="flex-shrink-0" />
                              {question.company}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell 
                          className="font-medium cursor-pointer hover:text-primary hover:underline"
                          onClick={() => navigate(`/interview-prep/question/${question.id}`)}
                        >
                          {question.questionTitle || "Untitled Question"}
                        </TableCell>
                        <TableCell>
                          {question.difficulty ? (
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
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isCompleted ? (
                            <Badge variant="default" className="gap-1.5 bg-green-500/20 text-green-500 border-green-500/50">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default InterviewModule;

