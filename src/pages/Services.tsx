import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SearchFilters } from "@/components/services/SearchFilters";
import { ServiceCenterCard, ServiceCenter } from "@/components/services/ServiceCenterCard";
import { ProductAnalyzer } from "@/components/services/ProductAnalyzer";
import { repairServices, categories } from "@/data/repairServices";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, Loader2, MapPinOff, AlertCircle, Navigation } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { searchNearbyRepairServices, geocodeLocation, NearbyService } from "@/lib/locationServices";
import { toast } from "@/hooks/use-toast";

const ServicesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [nearbyServices, setNearbyServices] = useState<NearbyService[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const geolocation = useGeolocation();

  // When geolocation is obtained, search for nearby services
  useEffect(() => {
    if (geolocation.latitude && geolocation.longitude) {
      setUserCoords({ lat: geolocation.latitude, lon: geolocation.longitude });
      fetchNearbyServices(geolocation.latitude, geolocation.longitude);
    }
  }, [geolocation.latitude, geolocation.longitude]);

  const fetchNearbyServices = async (lat: number, lon: number, query?: string) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const services = await searchNearbyRepairServices(lat, lon, selectedCategory, query ?? searchQuery);
      setNearbyServices(services);
      if (services.length > 0) {
        toast({
          title: "Services Found",
          description: `Found ${services.length} repair services within 25 km`,
        });
      } else {
        toast({
          title: "No Services Found",
          description: "No repair services found within 25 km. Try a different location.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        title: "Search Failed",
        description: "Failed to search for nearby services. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseMyLocation = () => {
    toast({
      title: "Allow Location Access",
      description:
        "When your browser shows the location popup, click Allow so we can find nearby repair centers.",
    });
    geolocation.getLocation();
  };

  const filteredServices = useMemo(() => {
    return repairServices.filter((service) => {
      const matchesQuery =
        !searchQuery ||
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.specialties.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        !selectedCategory ||
        selectedCategory === "all" ||
        service.categories.includes(selectedCategory);

      const matchesLocation =
        !searchLocation ||
        service.city.toLowerCase().includes(searchLocation.toLowerCase()) ||
        service.zipCode.includes(searchLocation);

      return matchesQuery && matchesCategory && matchesLocation;
    });
  }, [searchQuery, selectedCategory, searchLocation]);

  const handleSearch = async (query: string, category: string, location: string) => {
    setSearchQuery(query);
    setSelectedCategory(category);
    setSearchLocation(location);

    // If location is provided, geocode and search
    if (location && location.trim()) {
      setIsSearching(true);
      setHasSearched(true);
      const coords = await geocodeLocation(location);
      if (coords) {
        setUserCoords(coords);
        await fetchNearbyServices(coords.lat, coords.lon, query);
      } else {
        toast({
          title: "Location Not Found",
          description: "Could not find the specified location. Please try a different search.",
          variant: "destructive",
        });
        setIsSearching(false);
      }
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? "" : categoryId);
  };

  const handleAIRecommendations = (recommendations: NearbyService[]) => {
    // When AI returns recommendations and user chooses to show them, populate nearbyServices
    setNearbyServices(recommendations);
    setHasSearched(true);
    // Optionally show a toast
    if (recommendations.length === 0) {
      toast({ title: "No AI Recommendations", description: "AI couldn't find nearby repair centers." });
    } else {
      toast({ title: "AI Recommendations", description: `Showing ${recommendations.length} recommended centers` });
    }
  };

  // Re-run nearby search when category or query changes if we have user coordinates
  useEffect(() => {
    if (!userCoords) return;
    // Only auto-refetch if user has already performed a search or location was auto-used
    if (!hasSearched && !geolocation.latitude) return;

    const timer = setTimeout(() => {
      fetchNearbyServices(userCoords.lat, userCoords.lon, searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, userCoords]);

  // Convert nearby services to ServiceCenter format
  const serviceCenters: ServiceCenter[] = nearbyServices.map((service) => ({
    id: service.id,
    name: service.name,
    address: service.address,
    phone: service.phone,
    distance: service.distance, // human readable
    distanceKm: service.distanceKm,
    type: service.type,
    lat: service.lat,
    lon: service.lon,
  }));

  // Check if location was denied
  const isLocationDenied = geolocation.error?.includes("denied");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="bg-gradient-to-b from-secondary/50 to-background py-12 md:py-16">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Find Service Centers Near You
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover trusted local repair shops within 25 km. Get directions and contact them directly.
              </p>
            </motion.div>

            {/* AI Product Analyzer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-2xl mx-auto mb-10"
            >
              <ProductAnalyzer onRecommendations={handleAIRecommendations} onRequestSearch={(category, location, query) => {
                // If user provided location in analyzer, geocode and run search
                (async () => {
                  setIsSearching(true);
                  setHasSearched(true);
                  try {
                    if (location && location.trim()) {
                      const coords = await geocodeLocation(location);
                      if (coords) {
                        setUserCoords(coords);
                        await fetchNearbyServices(coords.lat, coords.lon, query ?? searchQuery);
                      } else {
                        toast({ title: 'Location Not Found', description: 'Could not find the specified location from AI analyzer', variant: 'destructive' });
                      }
                    } else if (userCoords) {
                      await fetchNearbyServices(userCoords.lat, userCoords.lon, query ?? searchQuery);
                    } else if (geolocation.latitude && geolocation.longitude) {
                      await fetchNearbyServices(geolocation.latitude, geolocation.longitude, query ?? searchQuery);
                    } else {
                      toast({ title: 'No Location', description: 'Provide a location or allow location access to search nearby centers', variant: 'destructive' });
                    }
                  } finally {
                    setIsSearching(false);
                  }
                })();
              }} />
            </motion.div>

            <SearchFilters 
              onSearch={handleSearch} 
              onUseMyLocation={handleUseMyLocation}
              isLoadingLocation={geolocation.loading}
              locationError={geolocation.error}
            />

            {/* Category pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "secondary"}
                  className="cursor-pointer px-4 py-2 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-12 md:py-16">
          <div className="container">
            {/* Status bar */}
            <div className="flex items-center justify-between mb-8">
              {isSearching ? (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching for service centers within 25 km...
                </p>
              ) : serviceCenters.length > 0 ? (
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {serviceCenters.length}
                  </span>{" "}
                  service centers found
                  <span className="ml-1 text-primary">(sorted by distance)</span>
                </p>
              ) : hasSearched ? (
                <p className="text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  No service centers found within 25 km
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Use your location or search to find nearby service centers
                </p>
              )}
            </div>

            {/* Location Permission Denied State */}
            {isLocationDenied && !hasSearched && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-card rounded-xl card-shadow mb-8"
              >
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <MapPinOff className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">
                  Location Access Denied
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  We couldn't access your location. You can manually enter a city or ZIP code in the search bar above to find nearby service centers.
                </p>
              </motion.div>
            )}

            {/* Service Centers List */}
            {serviceCenters.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {serviceCenters.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <ServiceCenterCard service={service} />
                  </motion.div>
                ))}
              </div>
            ) : hasSearched && !isSearching ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Wrench className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">
                  No Service Centers Found
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  We couldn't find any repair service centers within 25 km of your location. 
                  Try searching for a different area or city.
                </p>
                <Button onClick={handleUseMyLocation} disabled={geolocation.loading}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Try Different Location
                </Button>
              </motion.div>
            ) : !hasSearched && !isLocationDenied ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Navigation className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">
                  Find Service Centers Near You
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Enable location access or enter your city/ZIP code to discover repair service centers within 25 km.
                </p>
                <Button onClick={handleUseMyLocation} disabled={geolocation.loading}>
                  {geolocation.loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4 mr-2" />
                  )}
                  Use My Location
                </Button>
              </motion.div>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ServicesPage;
