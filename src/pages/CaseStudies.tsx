import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Code } from "lucide-react";

const CaseStudies = () => {
  const caseStudies = [
    {
      title: "Customer Churn Prediction",
      description: "Built a machine learning model to predict customer churn for a telecom company, achieving 89% accuracy",
      industry: "Telecom",
      techniques: ["Random Forest", "XGBoost", "Feature Engineering"],
      outcomes: ["89% Accuracy", "Reduced churn by 15%", "₹50L annual savings"],
      dataset: true,
      notebook: true,
      pdf: true,
    },
    {
      title: "Sales Forecasting with Time Series",
      description: "Developed an ARIMA model for retail sales prediction with seasonal adjustments",
      industry: "Retail",
      techniques: ["ARIMA", "SARIMA", "Prophet"],
      outcomes: ["92% forecast accuracy", "Optimized inventory", "30% cost reduction"],
      dataset: true,
      notebook: true,
      pdf: true,
    },
    {
      title: "Sentiment Analysis for Social Media",
      description: "NLP-based sentiment analysis system for brand monitoring across Twitter and Instagram",
      industry: "Marketing",
      techniques: ["BERT", "LSTM", "Word2Vec"],
      outcomes: ["Real-time monitoring", "85% accuracy", "Improved response time"],
      dataset: true,
      notebook: true,
      pdf: true,
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-up">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Case Studies
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-world data science projects with detailed analysis, code, and downloadable resources
          </p>
        </div>

        {/* Case Studies */}
        <div className="space-y-8">
          {caseStudies.map((study, index) => (
            <GlassCard key={index} className="hover:border-primary/50">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-primary">{study.industry}</Badge>
                    {study.techniques.map((tech, i) => (
                      <Badge key={i} variant="outline">{tech}</Badge>
                    ))}
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3">{study.title}</h3>
                  <p className="text-muted-foreground mb-4">{study.description}</p>

                  {/* Key Outcomes */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 text-primary">Key Outcomes:</h4>
                    <ul className="space-y-1">
                      {study.outcomes.map((outcome, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">✓</span>
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Downloads */}
                  <div className="flex flex-wrap gap-3">
                    {study.dataset && (
                      <Button size="sm" variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Dataset
                      </Button>
                    )}
                    {study.notebook && (
                      <Button size="sm" variant="outline" className="gap-2">
                        <Code className="h-4 w-4" />
                        Notebook
                      </Button>
                    )}
                    {study.pdf && (
                      <Button size="sm" variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        PDF Report
                      </Button>
                    )}
                    <Button size="sm" className="bg-gradient-primary gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View Full Analysis
                    </Button>
                  </div>
                </div>

                {/* Placeholder Visual */}
                <div className="lg:w-80 h-64 bg-gradient-subtle rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">📊</div>
                    <p className="text-sm text-muted-foreground">Analysis Visualization</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* CTA */}
        <GlassCard className="mt-12 text-center py-12 bg-gradient-subtle">
          <h2 className="text-3xl font-bold mb-4">Want a Custom Case Study?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            I can create detailed case studies tailored to your industry and business needs
          </p>
          <Button size="lg" className="bg-gradient-accent hover:shadow-glow-secondary">
            Request Custom Analysis
          </Button>
        </GlassCard>
      </div>
    </div>
  );
};

export default CaseStudies;