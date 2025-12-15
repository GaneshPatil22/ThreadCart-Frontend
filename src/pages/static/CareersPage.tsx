import StaticPageLayout from "../../components/StaticPageLayout";
import { Briefcase, MapPin, Clock } from "lucide-react";
import { CONTACT } from "../../utils/constants";

interface JobOpening {
  title: string;
  department: string;
  location: string;
  type: string;
}

const jobOpenings: JobOpening[] = [
  {
    title: "Sales Executive - Industrial Fasteners",
    department: "Sales",
    location: "Mumbai, Maharashtra",
    type: "Full-time"
  },
  {
    title: "Technical Support Engineer",
    department: "Customer Support",
    location: "Pune, Maharashtra",
    type: "Full-time"
  },
  {
    title: "Warehouse Operations Manager",
    department: "Operations",
    location: "Chennai, Tamil Nadu",
    type: "Full-time"
  },
  {
    title: "Digital Marketing Specialist",
    department: "Marketing",
    location: "Remote",
    type: "Full-time"
  }
];

const benefits = [
  "Competitive salary packages",
  "Health insurance for you and family",
  "Flexible work arrangements",
  "Professional development opportunities",
  "Performance bonuses",
  "Collaborative work environment"
];

export default function CareersPage() {
  return (
    <StaticPageLayout title="Careers">
      <p className="text-lg mb-8">
        Join our team and be part of India's growing industrial fastener industry.
        We're always looking for talented individuals who share our passion for quality and customer service.
      </p>

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Why Work With Us?</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-white p-4 rounded-lg border border-border"
            >
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              <span className="text-text-secondary">{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Current Openings</h2>
        <div className="space-y-4">
          {jobOpenings.map((job, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {job.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.type}
                    </span>
                  </div>
                </div>
                <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium whitespace-nowrap">
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-background p-6 rounded-lg border border-border">
        <h3 className="font-semibold text-text-primary mb-2">Don't See the Right Role?</h3>
        <p className="text-text-secondary mb-4">
          We're always interested in meeting talented people. Send us your resume and we'll keep you in mind for future opportunities.
        </p>
        <a
          href={`mailto:${CONTACT.EMAIL}`}
          className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
        >
          Send Your Resume
        </a>
      </div>
    </StaticPageLayout>
  );
}
