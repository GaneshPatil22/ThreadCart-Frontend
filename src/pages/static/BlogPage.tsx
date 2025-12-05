import StaticPageLayout from "../../components/StaticPageLayout";
import { Calendar, ArrowRight } from "lucide-react";

interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  category: string;
}

const blogPosts: BlogPost[] = [
  {
    title: "Understanding Fastener Grades: A Complete Guide",
    excerpt: "Learn about different fastener grades, their strength ratings, and how to choose the right grade for your application.",
    date: "December 1, 2024",
    category: "Technical Guide"
  },
  {
    title: "Stainless Steel vs Carbon Steel Fasteners: Which to Choose?",
    excerpt: "A detailed comparison of stainless steel and carbon steel fasteners, including pros, cons, and ideal use cases.",
    date: "November 25, 2024",
    category: "Comparison"
  },
  {
    title: "5 Common Fastener Mistakes and How to Avoid Them",
    excerpt: "Avoid costly errors in your projects by understanding these common fastener selection and installation mistakes.",
    date: "November 18, 2024",
    category: "Tips & Tricks"
  },
  {
    title: "The Importance of Torque Specifications in Fastening",
    excerpt: "Why proper torque matters for joint integrity and how to ensure you're applying the correct torque values.",
    date: "November 10, 2024",
    category: "Technical Guide"
  },
  {
    title: "Corrosion-Resistant Coatings for Fasteners Explained",
    excerpt: "An overview of popular coating options like zinc, galvanized, and specialty coatings for enhanced corrosion resistance.",
    date: "November 3, 2024",
    category: "Materials"
  }
];

export default function BlogPage() {
  return (
    <StaticPageLayout title="Blog">
      <p className="text-lg mb-8">
        Stay updated with the latest insights, technical guides, and industry news from ThreadCart.
      </p>

      <div className="space-y-6">
        {blogPosts.map((post, index) => (
          <article
            key={index}
            className="bg-white p-6 rounded-lg border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 mb-3">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                {post.category}
              </span>
              <span className="flex items-center text-xs text-text-secondary">
                <Calendar className="w-3 h-3 mr-1" />
                {post.date}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">{post.title}</h2>
            <p className="text-text-secondary text-sm mb-4">{post.excerpt}</p>
            <button className="flex items-center text-primary text-sm font-medium hover:underline">
              Read More <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </article>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-text-secondary mb-4">More articles coming soon!</p>
        <p className="text-sm">
          Want to contribute? Reach out at{" "}
          <a href="mailto:content@threadcart.com" className="text-primary hover:underline">
            content@threadcart.com
          </a>
        </p>
      </div>
    </StaticPageLayout>
  );
}
