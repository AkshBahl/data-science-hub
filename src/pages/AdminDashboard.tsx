import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, LogOut, Plus, Edit, Trash2, Lock, Unlock, Briefcase, LineChart, Users, Lightbulb, Code, Brain, BookOpen, TrendingUp, Database, BarChart3, Zap, Target, LayoutDashboard, FileText, FolderOpen, Newspaper, Settings, UserCheck } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
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

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime?: string;
  date?: string;
  featured?: boolean;
  url?: string;
};

type Service = {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
  price: string;
  ctaLabel?: string;
  ctaUrl?: string;
};
type AdminSection = "questions" | "case-studies" | "projects" | "blog" | "services" | "users";

const AdminDashboard = () => {
  const DEFAULT_TITLE = "General";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUserPaidStatus, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>("questions");

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
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isBlogDialogOpen, setIsBlogDialogOpen] = useState(false);
  const [isSavingBlog, setIsSavingBlog] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [blogForm, setBlogForm] = useState({
    title: "",
    excerpt: "",
    category: "",
    readTime: "",
    date: "",
    featured: false,
    url: "",
  });
  const [services, setServices] = useState<Service[]>([]);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    icon: "Briefcase",
    title: "",
    description: "",
    features: "",
    price: "",
    ctaLabel: "",
    ctaUrl: "",
  });

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

  useEffect(() => {
    const q = query(collection(db, "blogPosts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBlogPosts(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title || "Untitled post",
            excerpt: data.excerpt || "",
            category: data.category || "General",
            readTime: data.readTime,
            date: data.date,
            featured: Boolean(data.featured),
            url: data.url,
          } as BlogPost;
        }),
      );
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setServices(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            icon: data.icon || "Briefcase",
            title: data.title || "Untitled Service",
            description: data.description || "",
            features: Array.isArray(data.features) ? data.features : [],
            price: data.price || "",
            ctaLabel: data.ctaLabel,
            ctaUrl: data.ctaUrl,
          } as Service;
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

  const openBlogDialog = (blog?: BlogPost) => {
    if (blog) {
      setEditingBlog(blog);
      setBlogForm({
        title: blog.title,
        excerpt: blog.excerpt,
        category: blog.category,
        readTime: blog.readTime || "",
        date: blog.date || "",
        featured: blog.featured || false,
        url: blog.url || "",
      });
    } else {
      setEditingBlog(null);
      setBlogForm({
        title: "",
        excerpt: "",
        category: "",
        readTime: "",
        date: "",
        featured: false,
        url: "",
      });
    }
    setIsBlogDialogOpen(true);
  };

  const handleSaveBlog = async () => {
    if (!blogForm.title.trim() || !blogForm.excerpt.trim() || !blogForm.url.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide title, excerpt, and URL.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingBlog(true);
    try {
      if (editingBlog) {
        await updateDoc(doc(db, "blogPosts", editingBlog.id), {
          title: blogForm.title.trim(),
          excerpt: blogForm.excerpt.trim(),
          category: blogForm.category.trim() || "General",
          readTime: blogForm.readTime.trim() || undefined,
          date: blogForm.date.trim() || undefined,
          featured: blogForm.featured,
          url: blogForm.url.trim(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Blog post updated" });
      } else {
        await addDoc(collection(db, "blogPosts"), {
          title: blogForm.title.trim(),
          excerpt: blogForm.excerpt.trim(),
          category: blogForm.category.trim() || "General",
          readTime: blogForm.readTime.trim() || undefined,
          date: blogForm.date.trim() || undefined,
          featured: blogForm.featured,
          url: blogForm.url.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Blog post added" });
      }
      setIsBlogDialogOpen(false);
      setEditingBlog(null);
    } catch (error: any) {
      toast({
        title: "Failed to save blog post",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingBlog(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm("Delete this blog post?")) return;
    try {
      await deleteDoc(doc(db, "blogPosts", id));
      toast({ title: "Blog post deleted" });
    } catch (error: any) {
      toast({
        title: "Failed to delete blog post",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const openServiceDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        icon: service.icon,
        title: service.title,
        description: service.description,
        features: service.features.join("\n"),
        price: service.price,
        ctaLabel: service.ctaLabel || "",
        ctaUrl: service.ctaUrl || "",
      });
    } else {
      setEditingService(null);
      setServiceForm({
        icon: "Briefcase",
        title: "",
        description: "",
        features: "",
        price: "",
        ctaLabel: "",
        ctaUrl: "",
      });
    }
    setIsServiceDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.title.trim() || !serviceForm.description.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide title and description.",
        variant: "destructive",
      });
      return;
    }

    const featuresArray = serviceForm.features
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    setIsSavingService(true);
    try {
      if (editingService) {
        await updateDoc(doc(db, "services", editingService.id), {
          icon: serviceForm.icon,
          title: serviceForm.title.trim(),
          description: serviceForm.description.trim(),
          features: featuresArray,
          price: serviceForm.price.trim() || undefined,
          ctaLabel: serviceForm.ctaLabel.trim() || undefined,
          ctaUrl: serviceForm.ctaUrl.trim() || undefined,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Service updated" });
      } else {
        await addDoc(collection(db, "services"), {
          icon: serviceForm.icon,
          title: serviceForm.title.trim(),
          description: serviceForm.description.trim(),
          features: featuresArray,
          price: serviceForm.price.trim() || undefined,
          ctaLabel: serviceForm.ctaLabel.trim() || undefined,
          ctaUrl: serviceForm.ctaUrl.trim() || undefined,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Service added" });
      }
      setIsServiceDialogOpen(false);
      setEditingService(null);
    } catch (error: any) {
      toast({
        title: "Failed to save service",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await deleteDoc(doc(db, "services", id));
      toast({ title: "Service deleted" });
    } catch (error: any) {
      toast({
        title: "Failed to delete service",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const navigationItems = [
    { id: "questions" as AdminSection, label: "Interview Questions", icon: FileText },
    { id: "case-studies" as AdminSection, label: "Case Studies", icon: FolderOpen },
    { id: "projects" as AdminSection, label: "Projects", icon: Briefcase },
    { id: "blog" as AdminSection, label: "Blog Posts", icon: Newspaper },
    { id: "services" as AdminSection, label: "Services", icon: Settings },
    { id: "users" as AdminSection, label: "Learner Access", icon: UserCheck },
  ];

  const getSectionDescription = (section: AdminSection): string => {
    switch (section) {
      case "questions":
        return "Create, edit, or remove questions from the public repository.";
      case "case-studies":
        return "Publish detailed case studies to showcase real-world projects.";
      case "projects":
        return "Upload project resources so users can download them.";
      case "blog":
        return "Manage blog posts that link to your Medium articles.";
      case "services":
        return "Manage services that appear on the Services page.";
      case "users":
        return "Toggle premium access for any user after payment confirmation.";
      default:
        return "";
    }
  };

  // Define render functions before renderContent
  const renderQuestionsSection = () => (
    <GlassCard className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div></div>
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
  );

  const renderCaseStudiesSection = () => (
    <GlassCard className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div></div>
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
  );

  const renderProjectsSection = () => (
    <GlassCard className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div></div>
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
  );

  const renderBlogSection = () => (
    <GlassCard className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div></div>
        <Dialog open={isBlogDialogOpen} onOpenChange={setIsBlogDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openBlogDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Blog Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBlog ? "Edit Blog Post" : "Add Blog Post"}</DialogTitle>
              <DialogDescription>
                Add a blog post that links to your Medium article. The URL should point to your Medium post.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blog-title">Title *</Label>
                <Input
                  id="blog-title"
                  placeholder="Enter blog post title"
                  value={blogForm.title}
                  onChange={(e) => setBlogForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-excerpt">Excerpt *</Label>
                <Textarea
                  id="blog-excerpt"
                  placeholder="Short description or excerpt of the blog post"
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blog-category">Category</Label>
                  <Input
                    id="blog-category"
                    placeholder="e.g. Data Science, Tutorial, Career"
                    value={blogForm.category}
                    onChange={(e) => setBlogForm((prev) => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-readTime">Read Time</Label>
                  <Input
                    id="blog-readTime"
                    placeholder="e.g. 5 min read"
                    value={blogForm.readTime}
                    onChange={(e) => setBlogForm((prev) => ({ ...prev, readTime: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-date">Date</Label>
                <Input
                  id="blog-date"
                  placeholder="e.g. January 15, 2024"
                  value={blogForm.date}
                  onChange={(e) => setBlogForm((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blog-url">Medium URL *</Label>
                <Input
                  id="blog-url"
                  type="url"
                  placeholder="https://medium.com/@tushar_datascience/..."
                  value={blogForm.url}
                  onChange={(e) => setBlogForm((prev) => ({ ...prev, url: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Link to your Medium article. Example: https://medium.com/@tushar_datascience/article-title
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="blog-featured"
                  checked={blogForm.featured}
                  onCheckedChange={(checked) => setBlogForm((prev) => ({ ...prev, featured: checked === true }))}
                />
                <Label htmlFor="blog-featured" className="text-sm font-normal cursor-pointer">
                  Mark as featured (will appear in Featured section)
                </Label>
              </div>
              <Button onClick={handleSaveBlog} disabled={isSavingBlog}>
                {isSavingBlog ? "Saving..." : editingBlog ? "Save changes" : "Add blog post"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {blogPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blog posts yet. Add your first blog post.</p>
        ) : (
          blogPosts.map((blog) => (
            <div key={blog.id} className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={blog.featured ? "default" : "outline"}>
                      {blog.featured ? "Featured" : blog.category || "General"}
                    </Badge>
                    {blog.featured && <Badge variant="outline">{blog.category || "General"}</Badge>}
                  </div>
                  <p className="text-lg font-semibold">{blog.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{blog.excerpt}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {blog.date && <span>{blog.date}</span>}
                    {blog.readTime && <span>{blog.readTime}</span>}
                    {blog.url && (
                      <a
                        href={blog.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View on Medium →
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" onClick={() => openBlogDialog(blog)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => handleDeleteBlog(blog.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );

  const renderServicesSection = () => (
    <GlassCard className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div></div>
        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openServiceDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
              <DialogDescription>
                Create or edit a service that will be displayed on the Services page.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service-icon">Icon</Label>
                  <Select
                    value={serviceForm.icon}
                    onValueChange={(value) => setServiceForm((prev) => ({ ...prev, icon: value }))}
                  >
                    <SelectTrigger id="service-icon">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Briefcase">Briefcase</SelectItem>
                      <SelectItem value="LineChart">LineChart</SelectItem>
                      <SelectItem value="Users">Users</SelectItem>
                      <SelectItem value="Lightbulb">Lightbulb</SelectItem>
                      <SelectItem value="Code">Code</SelectItem>
                      <SelectItem value="Brain">Brain</SelectItem>
                      <SelectItem value="BookOpen">BookOpen</SelectItem>
                      <SelectItem value="TrendingUp">TrendingUp</SelectItem>
                      <SelectItem value="Database">Database</SelectItem>
                      <SelectItem value="BarChart3">BarChart3</SelectItem>
                      <SelectItem value="Zap">Zap</SelectItem>
                      <SelectItem value="Target">Target</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-price">Price</Label>
                  <Input
                    id="service-price"
                    placeholder="e.g. Starting from ₹50,000"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm((prev) => ({ ...prev, price: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-title">Title *</Label>
                <Input
                  id="service-title"
                  placeholder="e.g. Freelance Data Science"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-description">Description *</Label>
                <Textarea
                  id="service-description"
                  placeholder="Short description of the service"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-features">Features (one per line) *</Label>
                <Textarea
                  id="service-features"
                  placeholder="Data analysis and visualization&#10;Machine learning model development&#10;Predictive analytics"
                  value={serviceForm.features}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, features: e.target.value }))}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">Enter each feature on a new line</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service-cta-label">CTA Button Label</Label>
                  <Input
                    id="service-cta-label"
                    placeholder="e.g. Get Started, Contact Us"
                    value={serviceForm.ctaLabel}
                    onChange={(e) => setServiceForm((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-cta-url">CTA Button URL (optional)</Label>
                  <Input
                    id="service-cta-url"
                    type="url"
                    placeholder="https://"
                    value={serviceForm.ctaUrl}
                    onChange={(e) => setServiceForm((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleSaveService} disabled={isSavingService}>
                {isSavingService ? "Saving..." : editingService ? "Save changes" : "Add service"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services yet. Add your first service.</p>
        ) : (
          services.map((service) => {
            const IconComponent = {
              Briefcase,
              LineChart,
              Users,
              Lightbulb,
              Code,
              Brain,
              BookOpen,
              TrendingUp,
              Database,
              BarChart3,
              Zap,
              Target,
            }[service.icon] || Briefcase;
            return (
              <div key={service.id} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-lg font-semibold">{service.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                    {service.price && (
                      <p className="text-sm font-semibold text-primary mb-2">{service.price}</p>
                    )}
                    <ul className="text-xs text-muted-foreground space-y-1 mb-2">
                      {service.features.slice(0, 3).map((feature, i) => (
                        <li key={i}>• {feature}</li>
                      ))}
                      {service.features.length > 3 && (
                        <li>... and {service.features.length - 3} more</li>
                      )}
                    </ul>
                    {service.ctaUrl && (
                      <a
                        href={service.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        CTA: {service.ctaLabel || "Get Started"} →
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => openServiceDialog(service)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDeleteService(service.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </GlassCard>
  );

  const renderUsersSection = () => (
    <GlassCard className="p-8 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div></div>
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
  );

  const renderContent = () => {
    switch (activeSection) {
      case "questions":
        return renderQuestionsSection();
      case "case-studies":
        return renderCaseStudiesSection();
      case "projects":
        return renderProjectsSection();
      case "blog":
        return renderBlogSection();
      case "services":
        return renderServicesSection();
      case "users":
        return renderUsersSection();
      default:
        return renderQuestionsSection();
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Admin Panel
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">Site Control Center</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-border">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">
              {navigationItems.find((item) => item.id === activeSection)?.label || "Dashboard"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {getSectionDescription(activeSection)}
            </p>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

