import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Wrench } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search for your item",
    description: "Tell us what needs fixing—from phones to furniture, we've got you covered.",
  },
  {
    icon: MapPin,
    title: "Discover nearby services",
    description: "Find trusted local repair shops in your area with ratings and reviews.",
  },
  {
    icon: Wrench,
    title: "Repair instead of replace",
    description: "Connect with experts who can bring your items back to life.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Finding a repair service has never been easier. Three simple steps to 
            extend the life of your belongings.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hover className="relative h-full">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <div className="h-10 w-10 rounded-full bg-hero-gradient text-primary-foreground font-heading font-bold flex items-center justify-center text-lg">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6 mt-4">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  
                  <h3 className="font-heading text-xl font-semibold mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
