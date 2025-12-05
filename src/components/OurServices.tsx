interface Service {
  title: string;
  description: string;
  image: string;
}

const services: Service[] = [
  {
    title: "Fast Delivery in 24 Hours",
    description:
      "Get your required fasteners delivered to your doorstep within just 24 hours, ensuring zero project delays.",
    image: "/OurServices/24 hr delivery.png",
  },
  {
    title: "CAD File",
    description:
      "Access ready-to-use CAD models for every fastener, ensuring faster design, accurate fitment, and seamless integration into your engineering workflow.",
    image: "/OurServices/CAD file.png",
  },
  {
    title: "Certified Quality Assurance",
    description:
      "Receive material and test certificates with every order, ensuring full traceability and trusted performance.",
    image: "/OurServices/Certified Quality Assurance.png",
  },
  {
    title: "Premium Packaging, Zero Hassle",
    description:
      "Premium, industry-grade packaging ensures your fasteners arrive organized, protected, and damage-free every time.",
    image: "/OurServices/Premium Packaging.png",
  },
  {
    title: "Instant & Transparent Pricing",
    description:
      "Get fastener quotes in under a minute with real-time, accurate pricing. No delays, no negotiations — just clear, upfront costs you can trust.",
    image: "/OurServices/Transparent pricing.png",
  },
];

export default function OurServices() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
          Our Services
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-background rounded-xl p-6 border border-border hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 mb-4 flex items-center justify-center">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {service.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
