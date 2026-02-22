import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Users, Layers, ArrowRight, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

const features = [
  { icon: Layers, title: 'Multi-Layer Map', desc: 'Study spots, nightlife, cafés, coworking & more' },
  { icon: ThumbsUp, title: 'Student-Driven', desc: 'Spots appear only after 5+ student endorsements' },
  { icon: Star, title: 'Ratings & Reviews', desc: 'Honest reviews from fellow students' },
  { icon: Users, title: 'Community', desc: 'Built by KTH students, for Stockholm students' },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.03]" />
        <div className="container relative py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <MapPin className="h-4 w-4" /> For KTH & Stockholm Students
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Your city.
              <br />
              <span className="text-gradient-hero">Student-approved.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground md:text-xl">
              Discover the best study spots, cafés, nightlife and hidden gems in Stockholm — all recommended by students like you.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 bg-gradient-hero shadow-glow" asChild>
                <Link to="/explore">
                  <MapPin className="h-5 w-5" /> Explore the Map <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Users className="h-5 w-5" /> Join as Student
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="rounded-xl bg-card p-6 shadow-card"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-xl rounded-2xl bg-gradient-hero p-8 text-center text-primary-foreground shadow-glow md:p-12">
            <h2 className="font-display text-2xl font-bold md:text-3xl">Know a great spot?</h2>
            <p className="mt-2 text-primary-foreground/80">Help fellow students discover Stockholm's best kept secrets.</p>
            <Button size="lg" variant="secondary" className="mt-6 gap-2" asChild>
              <Link to="/explore">
                Add a Spot <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-hero">
              <MapPin className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-semibold">Spotter</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Spotter. Made with ❤️ by KTH students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
