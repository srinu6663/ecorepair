import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Leaf, Heart, Clock } from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    title: "Save Money",
    description: "Repairs typically cost 60-70% less than buying new. Keep more money in your pocket.",
    stat: "60-70%",
    statLabel: "Average savings",
  },
  {
    icon: Leaf,
    title: "Reduce E-Waste",
    description: "53.6 million tons of e-waste is generated globally each year. Be part of the solution.",
    stat: "25-50kg",
    statLabel: "CO₂ saved per repair",
  },
  {
    icon: Heart,
    title: "Support Local Business",
    description: "Every repair supports skilled workers and strengthens your local economy.",
    stat: "3-5",
    statLabel: "Jobs per repair shop",
  },
  {
    icon: Clock,
    title: "Extend Product Life",
    description: "Most electronics can be repaired multiple times, doubling or tripling their lifespan.",
    stat: "2-3x",
    statLabel: "Extended lifespan",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Why Choose Repair?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Repairing isn't just good for your wallet—it's essential for our planet 
            and communities.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card hover className="h-full">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  
                  <h3 className="font-heading text-lg font-semibold mb-2">
                    {benefit.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {benefit.description}
                  </p>
                  
                  <div className="pt-4 border-t">
                    <div className="font-heading text-2xl font-bold text-primary">
                      {benefit.stat}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {benefit.statLabel}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
