import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Download, FileText, Database, Code, Book } from "lucide-react";

const Projects = () => {
  const resources = [
    {
      category: "Datasets",
      icon: Database,
      items: [
        { name: "Customer Churn Dataset", size: "2.5 MB", downloads: 1250 },
        { name: "Sales Forecasting Data", size: "5.1 MB", downloads: 980 },
        { name: "Credit Card Fraud Dataset", size: "15 MB", downloads: 2100 },
        { name: "E-commerce Transaction Data", size: "8.3 MB", downloads: 1560 },
      ],
    },
    {
      category: "Cheat Sheets",
      icon: FileText,
      items: [
        { name: "Python Data Science Cheat Sheet", size: "PDF", downloads: 3200 },
        { name: "SQL Quick Reference", size: "PDF", downloads: 2850 },
        { name: "Machine Learning Algorithms", size: "PDF", downloads: 3750 },
        { name: "Statistics Formulas", size: "PDF", downloads: 2100 },
      ],
    },
    {
      category: "Code Templates",
      icon: Code,
      items: [
        { name: "EDA Template Notebook", size: "IPYNB", downloads: 1890 },
        { name: "ML Pipeline Template", size: "PY", downloads: 1450 },
        { name: "Data Cleaning Scripts", size: "PY", downloads: 1670 },
        { name: "Visualization Templates", size: "IPYNB", downloads: 2200 },
      ],
    },
    {
      category: "Learning Roadmaps",
      icon: Book,
      items: [
        { name: "Data Scientist Roadmap 2024", size: "PDF", downloads: 4100 },
        { name: "ML Engineer Path", size: "PDF", downloads: 3250 },
        { name: "Business Analyst Roadmap", size: "PDF", downloads: 2780 },
        { name: "Python Developer Track", size: "PDF", downloads: 2950 },
      ],
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-up">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Free Resources & Downloads
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Access free datasets, cheat sheets, templates, and learning resources to accelerate your data science journey
          </p>
        </div>

        {/* Resources */}
        {resources.map((category, index) => {
          const Icon = category.icon;
          return (
            <div key={index} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="text-3xl font-bold">{category.category}</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {category.items.map((item, itemIndex) => (
                  <GlassCard key={itemIndex} className="hover:border-primary/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{item.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{item.size}</span>
                          <span>•</span>
                          <span>{item.downloads} downloads</span>
                        </div>
                      </div>
                      <Button className="bg-gradient-primary hover:shadow-glow-primary ml-4">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          );
        })}

        {/* Newsletter CTA */}
        <GlassCard className="text-center py-12 bg-gradient-subtle">
          <h2 className="text-3xl font-bold mb-4">Get Notified of New Resources</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Subscribe to receive updates when new datasets, templates, and learning resources are added
          </p>
          <div className="flex gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:outline-none focus:border-primary"
            />
            <Button className="bg-gradient-accent hover:shadow-glow-secondary">
              Subscribe
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Projects;