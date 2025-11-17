import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, LogOut, Plus, Edit, Trash2, Lock, Unlock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type InterviewQuestion = {
  id: string;
  title?: string;
  topic?: string;
  question: string;
  answer: string;
  tier: "free" | "paid";
  createdAt?: Date;
};

type ManagedUser = {
  id: string;
  displayName?: string;
  email?: string;
  isPaid?: boolean;
  createdAt?: Date;
};

type CaseStudy = {
  id: string;
  title: string;
  description: string;
  industry: string;
  techniques: string[];
  outcomes: string[];
  datasetUrl?: string;
  notebookUrl?: string;
  pdfUrl?: string;
  viewUrl?: string;
  coverEmoji?: string;
};

type ProjectResource = {
  id: string;
  title: string;
  description: string;
  category: string;
  techStack: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  badge?: string;
  coverEmoji?: string;
};
const AdminDashboard = () => {
  const DEFAULT_TITLE = "General";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUserPaidStatus, logout } = useAuth();

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({
    title: "",
    topic: "",
    question: "",
    answer: "",
    tier: "free" as "free" | "paid",
  });
  const [userSearch, setUserSearch] = useState("");
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [isCaseDialogOpen, setIsCaseDialogOpen] = useState(false);
  const [isSavingCaseStudy, setIsSavingCaseStudy] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] = useState<CaseStudy | null>(null);
  const [caseStudyForm, setCaseStudyForm] = useState({
    title: "",
    description: "",
    industry: "",
    techniques: "",
    outcomes: "",
    datasetUrl: "",
    notebookUrl: "",
    pdfUrl: "",
    viewUrl: "",
    coverEmoji: "",
  });
  const [projects, setProjects] = useState<ProjectResource[]>([]);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectResource | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    category: "",
    techStack: "",
    ctaLabel: "",
    ctaUrl: "",
    badge: "",
    coverEmoji: "",
  });
  const [projectFile, setProjectFile] = useState<File | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  useEffect(() => {
    const q = query(collection(db, "interviewQuestions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mapped = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          topic: data.topic,
          question: data.question,
          answer: data.answer,
          tier: data.tier ?? "free",
          createdAt: data.createdAt?.toDate?.(),
        } as InterviewQuestion;
      });
      setQuestions(mapped);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mapped = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          displayName: data.displayName || "Unknown user",
          email: data.email,
          isPaid: data.isPaid ?? false,
          createdAt: data.createdAt?.toDate?.(),
        } as ManagedUser;
      });
      setUsers(mapped);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "caseStudies"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCaseStudies(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title || "Untitled Study",
            description: data.description || "",
            industry: data.industry || "General",
            techniques: Array.isArray(data.techniques) ? data.techniques : [],
            outcomes: Array.isArray(data.outcomes) ? data.outcomes : [],
            datasetUrl: data.datasetUrl,
            notebookUrl: data.notebookUrl,
            pdfUrl: data.pdfUrl,
            viewUrl: data.viewUrl,
            coverEmoji: data.coverEmoji,
          } as CaseStudy;
        }),
      );
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title || "Untitled project",
            description: data.description || "",
            category: data.category || "Project",
            techStack: Array.isArray(data.techStack) ? data.techStack : [],
            ctaLabel: data.ctaLabel,
            ctaUrl: data.ctaUrl,
            badge: data.badge,
            coverEmoji: data.coverEmoji,
          } as ProjectResource;
        }),
      );
    });
    return unsubscribe;
  }, []);

  const openCreateDialog = () => {
    setEditingQuestion(null);
    setQuestionForm({ title: "", topic: "", question: "", answer: "", tier: "free" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (question: InterviewQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      title: question.title ?? "",
      topic: question.topic ?? "",
      question: question.question,
      answer: question.answer,
      tier: question.tier,
    });
    setIsDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question.trim() || !questionForm.answer.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a question and an answer.",
        variant: "destructive",
      });
      return;
    }

    const normalizedTitle = questionForm.title.trim() || DEFAULT_TITLE;

    setIsSavingQuestion(true);
    try {
      if (editingQuestion) {
        await updateDoc(doc(db, "interviewQuestions", editingQuestion.id), {
          ...questionForm,
          title: normalizedTitle,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Question updated" });
      } else {
        await addDoc(collection(db, "interviewQuestions"), {
          ...questionForm,
          title: normalizedTitle,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Question added" });
      }
      setIsDialogOpen(false);
      setEditingQuestion(null);
    } catch (error: any) {
      toast({
        title: "Failed to save question",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Delete this question? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "interviewQuestions", id));
      toast({ title: "Question deleted" });
    } catch (error: any) {
      toast({
        title: "Failed to delete question",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    return users.filter((user) => {
      const term = userSearch.toLowerCase();
      return user.displayName?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term);
    });
  }, [userSearch, users]);

  const toggleUserPaidStatus = async (user: ManagedUser) => {
    if (!user.id) return;
    await setUserPaidStatus(user.id, !user.isPaid);
  };

  const openCaseStudyDialog = (study?: CaseStudy) => {
    if (study) {
      setEditingCaseStudy(study);
      setCaseStudyForm({
        title: study.title,
        description: study.description,
        industry: study.industry,
        techniques: study.techniques.join(", "),
        outcomes: study.outcomes.join("\n"),
        datasetUrl: study.datasetUrl || "",
        notebookUrl: study.notebookUrl || "",
        pdfUrl: study.pdfUrl || "",
        viewUrl: study.viewUrl || "",
        coverEmoji: study.coverEmoji || "",
      });
    } else {
      setEditingCaseStudy(null);
      setCaseStudyForm({
        title: "",
        description: "",
        industry: "",
        techniques: "",
        outcomes: "",
        datasetUrl: "",
        notebookUrl: "",
        pdfUrl: "",
        viewUrl: "",
        coverEmoji: "",
      });
    }
    setIsCaseDialogOpen(true);
  };

  const openProjectDialog = (project?: ProjectResource) => {
    if (project) {
      setEditingProject(project);
      setProjectForm({
        title: project.title,
        description: project.description,
        category: project.category,
        techStack: project.techStack.join(", "),
        ctaLabel: project.ctaLabel || "",
        ctaUrl: project.ctaUrl || "",
        badge: project.badge || "",
        coverEmoji: project.coverEmoji || "",
      });
      setProjectFile(null);
    } else {
      setEditingProject(null);
      setProjectForm({
        title: "",
        description: "",
        category: "",
        techStack: "",
        ctaLabel: "",
        ctaUrl: "",
        badge: "",
        coverEmoji: "",
      });
      setProjectFile(null);
    }
    setIsProjectDialogOpen(true);
  };

  const handleSaveCaseStudy = async () => {
    if (!caseStudyForm.title.trim() || !caseStudyForm.description.trim() || !caseStudyForm.industry.trim()) {
      toast({
        title: "Missing information",
        description: "Title, description, and industry are required.",
        variant: "destructive",
      });
      return;
    }

    const techniques = caseStudyForm.techniques
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const outcomes = caseStudyForm.outcomes
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    setIsSavingCaseStudy(true);
    try {
      if (editingCaseStudy) {
        await updateDoc(doc(db, "caseStudies", editingCaseStudy.id), {
          ...caseStudyForm,
          techniques,
          outcomes,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Case study updated" });
      } else {
        await addDoc(collection(db, "caseStudies"), {
          ...caseStudyForm,
          techniques,
          outcomes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Case study added" });
      }
      setIsCaseDialogOpen(false);
      setEditingCaseStudy(null);
    } catch (error: any) {
      toast({
        title: "Failed to save case study",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingCaseStudy(false);
    }
  };

  const handleDeleteCaseStudy = async (id: string) => {
    if (!window.confirm("Delete this case study?")) return;
    try {
      await deleteDoc(doc(db, "caseStudies", id));
      toast({ title: "Case study deleted" });
    } catch (error: any) {
      toast({
        title: "Failed to delete case study",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProject = async () => {
    if (!projectForm.title.trim() || !projectForm.description.trim() || !projectForm.category.trim()) {
      toast({
        title: "Missing information",
        description: "Title, description, and category are required.",
        variant: "destructive",
      });
      return;
    }

    const techStack = projectForm.techStack
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    let ctaUrl = projectForm.ctaUrl.trim();
    let ctaLabel = projectForm.ctaLabel.trim() || (projectFile ? "Download" : "");

    setIsSavingProject(true);
    try {
      if (projectFile) {
        const fileRef = ref(storage, `projects/${Date.now()}_${projectFile.name}`);
        await uploadBytes(fileRef, projectFile);
        ctaUrl = await getDownloadURL(fileRef);
        if (!ctaLabel) {
          ctaLabel = "Download";
        }
      }

      if (!ctaUrl) {
        toast({
          title: "Missing download link",
          description: "Provide a file or a download URL.",
          variant: "destructive",
        });
        setIsSavingProject(false);
        return;
      }

      if (editingProject) {
        await updateDoc(doc(db, "projects", editingProject.id), {
          ...projectForm,
          techStack,
          ctaUrl,
          ctaLabel,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Project updated" });
      } else {
        await addDoc(collection(db, "projects"), {
          ...projectForm,
          techStack,
          ctaUrl,
          ctaLabel,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Project added" });
      }
      setIsProjectDialogOpen(false);
      setEditingProject(null);
      setProjectFile(null);
    } catch (error: any) {
      toast({
        title: "Failed to save project",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      toast({ title: "Project deleted" });
    } catch (error: any) {
      toast({
        title: "Failed to delete project",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen py-24 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm uppercase tracking-widest text-primary font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Admin Access
            </p>
            <h1 className="text-4xl font-bold mt-2">Site Control Center</h1>
            <p className="text-muted-foreground mt-2">
              Manage interview prep content and unlock premium access for learners.
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Admin Logout
          </Button>
        </div>

        <GlassCard className="p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Interview Questions</h2>
              <p className="text-muted-foreground text-sm">
                Create, edit, or remove questions from the public repository.
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingQuestion ? "Edit Question" : "Add Question"}</DialogTitle>
                  <DialogDescription>Provide the prompt, answer, and whether it is free or premium.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Short title to group similar questions"
                      value={questionForm.title}
                      onChange={(e) => setQuestionForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="question">Question</Label>
                    <Textarea
                      id="question"
                      placeholder="Enter the interview question"
                      value={questionForm.question}
                      onChange={(e) => setQuestionForm((prev) => ({ ...prev, question: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="answer">Answer / Explanation</Label>
                    <Textarea
                      id="answer"
                      placeholder="Provide the answer or detailed guidance"
                      value={questionForm.answer}
                      onChange={(e) => setQuestionForm((prev) => ({ ...prev, answer: e.target.value }))}
                      rows={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tier</Label>
                    <Select
                      value={questionForm.tier}
                      onValueChange={(value: "free" | "paid") => setQuestionForm((prev) => ({ ...prev, tier: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSaveQuestion} disabled={isSavingQuestion}>
                    {isSavingQuestion ? "Saving..." : editingQuestion ? "Save changes" : "Add question"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No questions yet. Add your first interview question.</p>
            ) : (
              questions.map((question) => (
                <div key={question.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant={question.tier === "free" ? "outline" : "secondary"}>
                        {question.tier === "free" ? "Free" : "Paid"}
                      </Badge>
                      <p className="text-lg font-semibold mt-2">{question.title || "Untitled question"}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{question.question}</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-2">{question.answer}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" onClick={() => openEditDialog(question)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDeleteQuestion(question.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Case Studies</h2>
              <p className="text-muted-foreground text-sm">
                Publish detailed case studies to “Case Studies” page from here.
              </p>
            </div>
            <Dialog open={isCaseDialogOpen} onOpenChange={setIsCaseDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openCaseStudyDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Case Study
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{editingCaseStudy ? "Edit Case Study" : "Publish Case Study"}</DialogTitle>
                  <DialogDescription>Provide project details, techniques, and resource links.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={caseStudyForm.title}
                        onChange={(e) => setCaseStudyForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Customer Churn Prediction"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Input
                        value={caseStudyForm.industry}
                        onChange={(e) => setCaseStudyForm((prev) => ({ ...prev, industry: e.target.value }))}
                        placeholder="Telecom, Retail, Fintech…"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={caseStudyForm.description}
                      onChange={(e) => setCaseStudyForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      placeholder="Short overview of the case study."
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Techniques (comma separated)</Label>
                      <Textarea
                        rows={2}
                        value={caseStudyForm.techniques}
                        onChange={(e) => setCaseStudyForm((prev) => ({ ...prev, techniques: e.target.value }))}
                        placeholder="Random Forest, XGBoost, SQL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Key Outcomes (one per line)</Label>
                      <Textarea
                        rows={2}
                        value={caseStudyForm.outcomes}
                        onChange={(e) => setCaseStudyForm((prev) => ({ ...prev, outcomes: e.target.value }))}
                        placeholder={"• 89% accuracy\n• 15% churn reduction"}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Dataset URL</Label>
                      <Input
                        value={caseStudyForm.datasetUrl}
                        onChange={(e) => setCaseStudyForm((prev) => ({ ...prev, datasetUrl: e.target.value }))}
                        placeholder="https://"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notebook URL</Label>
                      <Input
                        value={caseStudyForm.notebookUrl}
                        onChange={(e) => setCaseStudyForm((prev) => ({ ...prev, notebookUrl: e.target.value }))}
                        placeholder="https://"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PDF URL</Label>
                      <Input
                        value={caseStudyForm.pdfUrl}
                        onChange={(e) => setCaseStudyForm((prev) => ({ ...prev, pdfUrl: e.target.value }))}
                        placeholder="https://"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Full Analysis URL</Label>
                      <Input
                        value={caseStudyForm.viewUrl}
                        onChange={(e) => setCaseStudyForm((prev) => ({ ...prev, viewUrl: e.target.value }))}
                        placeholder="https://"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cover Emoji (optional)</Label>
                    <Input
                      value={caseStudyForm.coverEmoji}
                      onChange={(e) => setCaseStudyForm((prev) => ({ ...prev, coverEmoji: e.target.value }))}
                      placeholder="📊"
                    />
                  </div>
                  <Button onClick={handleSaveCaseStudy} disabled={isSavingCaseStudy}>
                    {isSavingCaseStudy ? "Saving..." : editingCaseStudy ? "Save changes" : "Publish case study"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {caseStudies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No case studies yet.</p>
            ) : (
              caseStudies.map((study) => (
                <div key={study.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-muted-foreground">{study.industry}</p>
                      <p className="text-lg font-semibold">{study.title}</p>
                      <p className="text-sm text-muted-foreground">{study.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" onClick={() => openCaseStudyDialog(study)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDeleteCaseStudy(study.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {study.techniques.map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Projects & Downloads</h2>
              <p className="text-muted-foreground text-sm">
                Upload project resources so users can download them from the Projects page.
              </p>
            </div>
            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openProjectDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingProject ? "Edit Project" : "Publish Project"}</DialogTitle>
                  <DialogDescription>Provide resource details and download link.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={projectForm.title}
                      onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="EDA Template Notebook"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      value={projectForm.category}
                      onChange={(e) => setProjectForm((prev) => ({ ...prev, category: e.target.value }))}
                      placeholder="Datasets, Templates, Guides…"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      value={projectForm.description}
                      onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Short description of the resource."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tech stack / tags (comma separated)</Label>
                    <Textarea
                      rows={2}
                      value={projectForm.techStack}
                      onChange={(e) => setProjectForm((prev) => ({ ...prev, techStack: e.target.value }))}
                      placeholder="Python, SQL, Streamlit"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CTA Label</Label>
                      <Input
                        value={projectForm.ctaLabel}
                        onChange={(e) => setProjectForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                        placeholder="Download"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA URL</Label>
                      <Input
                        value={projectForm.ctaUrl}
                        onChange={(e) => setProjectForm((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                        placeholder="https://"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Badge (optional)</Label>
                      <Input
                        value={projectForm.badge}
                        onChange={(e) => setProjectForm((prev) => ({ ...prev, badge: e.target.value }))}
                        placeholder="New, Free, Pro…"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cover Emoji (optional)</Label>
                      <Input
                        value={projectForm.coverEmoji}
                        onChange={(e) => setProjectForm((prev) => ({ ...prev, coverEmoji: e.target.value }))}
                        placeholder="📦"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Upload file (optional)</Label>
                    <Input
                      type="file"
                      accept=".zip,.pdf,.ipynb,.py,.csv,.xlsx,.txt,.ppt,.pptx"
                      onChange={(e) => setProjectFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Uploading a file will automatically generate the download link.
                    </p>
                    {projectFile && (
                      <p className="text-xs text-primary">Selected: {projectFile.name}</p>
                    )}
                  </div>
                  <Button onClick={handleSaveProject} disabled={isSavingProject}>
                    {isSavingProject ? "Saving..." : editingProject ? "Save changes" : "Publish project"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects published yet.</p>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="border border-border rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-muted-foreground">{project.category}</p>
                      <p className="text-lg font-semibold">{project.title}</p>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" onClick={() => openProjectDialog(project)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDeleteProject(project.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {project.techStack.map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Learner Access</h2>
              <p className="text-sm text-muted-foreground">
                Toggle premium access for any user after payment confirmation.
              </p>
            </div>
            <Input
              placeholder="Search by name or email..."
              className="w-full md:w-72"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.isPaid ? "default" : "outline"} className="uppercase tracking-wide">
                      {user.isPaid ? "Paid Access" : "Free Access"}
                    </Badge>
                    <Button variant="outline" onClick={() => toggleUserPaidStatus(user)}>
                      {user.isPaid ? (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Revoke
                        </>
                      ) : (
                        <>
                          <Unlock className="mr-2 h-4 w-4" />
                          Grant Premium
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        
      </div>
    </div>
  );
};

export default AdminDashboard;

