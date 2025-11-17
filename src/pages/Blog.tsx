import { useEffect, useState } from "react";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

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

const Blog = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "blogPosts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPosts(
          snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
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
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast({
          title: "Unable to load blog posts",
          description: "Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [toast]);

  const featured = posts.filter((post) => post.featured);
  const recent = posts.filter((post) => !post.featured);

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 space-y-12 max-w-5xl">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">
            <span className="bg-gradient-primary bg-clip-text text-transparent">Blog</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Insights, tutorials, and career advice for data science professionals.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading posts…</p>
        ) : posts.length === 0 ? (
          <GlassCard className="text-center py-12 bg-gradient-subtle">
            <h2 className="text-2xl font-semibold mb-2">No posts yet</h2>
            <p className="text-muted-foreground">New articles will appear here once published.</p>
          </GlassCard>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold">Featured</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {featured.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {recent.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold">Recent</h2>
                <div className="space-y-6">
                  {recent.map((post) => (
                    <BlogCard key={post.id} post={post} compact />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const BlogCard = ({ post, compact }: { post: BlogPost; compact?: boolean }) => {
  return (
    <GlassCard className="group hover:border-primary/50">
      <div className={compact ? "flex gap-6" : "space-y-4"}>
        {!compact && (
          <div className="h-48 bg-gradient-subtle rounded-lg flex items-center justify-center">
            <div className="text-6xl">📝</div>
          </div>
        )}
        <div className="flex-1 space-y-3">
          <Badge className="bg-primary w-fit">{post.category}</Badge>
          <h3 className="text-2xl font-bold group-hover:text-primary transition">{post.title}</h3>
          <p className="text-muted-foreground">{post.excerpt}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {post.date && <span>{post.date}</span>}
              {post.readTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {post.readTime}
                </span>
              )}
            </div>
            {post.url && (
              <Button asChild variant="ghost" className="text-primary px-0">
                <a href={post.url} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  Read More
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default Blog;

