import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Trash2, 
  Globe, 
  TrendingUp, 
  Heart, 
  Target, 
  Users,
  ArrowRight
} from "lucide-react";
import { ewateStats } from "@/data/repairServices";

const stats = [
  {
    icon: Trash2,
    value: ewateStats.globalEwastePerYear,
    label: "tons of e-waste generated yearly",
    description: "That's equivalent to the weight of 350 cruise ships",
  },
  {
    icon: TrendingUp,
    value: ewateStats.ewateGrowthRate,
    label: "projected growth by 2030",
    description: "E-waste is the world's fastest-growing waste stream",
  },
  {
    icon: Globe,
    value: ewateStats.recycledPercentage,
    label: "properly recycled",
    description: "The rest ends up in landfills or is improperly disposed",
  },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-secondary/50 to-background py-16 md:py-24">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Why We Built{" "}
                <span className="text-gradient">RepairFirst</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                We believe that repair should be the default choice, not the exception. 
                Our mission is to make it easy for everyone to find local repair services 
                and reduce unnecessary waste.
              </p>
            </motion.div>
          </div>
        </section>

        {/* The Problem */}
        <section className="py-16 md:py-24">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                The E-Waste Crisis
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Electronic waste is one of the fastest-growing environmental challenges 
                of our time.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full text-center">
                    <CardContent className="pt-8 pb-8">
                      <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                        <stat.icon className="h-8 w-8 text-destructive" />
                      </div>
                      <div className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-2">
                        {stat.value}
                      </div>
                      <div className="font-medium text-foreground mb-2">
                        {stat.label}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                  Our Mission
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  RepairFirst was founded with a simple but powerful idea: what if 
                  finding a repair service was as easy as finding a restaurant?
                </p>
                <p className="text-lg text-muted-foreground mb-6">
                  We connect people with skilled local repair professionals who can 
                  breathe new life into broken electronics, appliances, clothing, and 
                  more. By making repair accessible, we're helping to:
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Target className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Reduce the 53.6 million metric tons of e-waste generated annually
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Heart className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Support local repair businesses and skilled craftspeople
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-muted-foreground">
                      Save consumers money while building sustainable habits
                    </span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="aspect-square rounded-3xl bg-hero-gradient p-8 flex items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <div className="font-heading text-6xl md:text-8xl font-bold mb-4">
                      {ewateStats.averageRepairSavings}
                    </div>
                    <div className="text-xl md:text-2xl opacity-90">
                      average savings when you repair vs. replace
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                Ready to Make a Difference?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Every item repaired is a step toward a more sustainable future. 
                Find a repair service near you today.
              </p>
              <Button variant="hero" size="xl" asChild>
                <Link to="/services">
                  Find Repair Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
