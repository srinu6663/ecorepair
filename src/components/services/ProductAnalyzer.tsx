import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, X, Loader2, Wrench, ShoppingCart, MapPin, Sparkles, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { NearbyService } from "@/lib/locationServices";

// Format value as Indian Rupee string, accepts number or string like '1200' or '1200-2500'
function formatAsINR(value?: string | number): string {
  if (value == null) return "";
  const USD_TO_INR = 83; // approximate conversion rate
  const s = String(value).trim();

  // Detect if original string mentions USD ($ or USD) or INR (₹ or INR)
  const isUSD = /\$|USD/i.test(s);
  const isINR = /₹|INR/i.test(s);

  // Helper to format a number as INR
  const fmt = (num: number) =>
    num.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  // Extract numeric tokens (handles commas and decimals)
  const nums = Array.from(s.matchAll(/\d+[\d,]*(?:\.\d+)?/g)).map(m => m[0].replace(/,/g, ""));
  if (nums.length >= 2) {
    let min = Number(nums[0]);
    let max = Number(nums[1]);
    if (isUSD) {
      min = Math.round(min * USD_TO_INR);
      max = Math.round(max * USD_TO_INR);
    }
    return `${fmt(min)} - ${fmt(max)}`;
  }
  if (nums.length === 1) {
    let n = Number(nums[0]);
    if (isUSD) n = Math.round(n * USD_TO_INR);
    return fmt(n);
  }

  // Fallback: try previous simple patterns
  const rangeMatch = s.replace(/,/g, "").match(/(\d+)(?:\s*(?:-|to)\s*)(\d+)/i);
  if (rangeMatch) {
    let min = Number(rangeMatch[1]);
    let max = Number(rangeMatch[2]);
    if (isUSD) {
      min = Math.round(min * USD_TO_INR);
      max = Math.round(max * USD_TO_INR);
    }
    return `${fmt(min)} - ${fmt(max)}`;
  }

  const numMatch = s.replace(/,/g, "").match(/(\d+)/);
  if (numMatch) {
    let n = Number(numMatch[1]);
    if (isUSD) n = Math.round(n * USD_TO_INR);
    return fmt(n);
  }

  // If the string already contains INR symbol, return it as-is (or formatted when possible)
  if (isINR) return s;

  // Fallback: return original string
  return s;
}

interface AnalysisResult {
  productName: string;
  category: string;
  condition: string;
  recommendation: "repair" | "replace";
  confidence: number;
  reasoning: string;
  repairEstimate?: string;
  replacementPriceRange?: { min: number; max: number };
  suggestedProducts?: Array<{ name: string; priceRange: string }>;
}

interface RepairService {
  id: string;
  name: string;
  address: string;
  distance: string;
  lat: number;
  lon: number;
}

interface AnalysisResponse {
  analysis: AnalysisResult;
  repairServices: RepairService[];
  timestamp: string;
}

interface ProductAnalyzerProps {
  onRecommendations?: (recommendations: NearbyService[]) => void;
  onRequestSearch?: (category?: string, location?: string, query?: string) => void;
}

export const ProductAnalyzer = ({ onRecommendations, onRequestSearch }: ProductAnalyzerProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mappedServices, setMappedServices] = useState<any[] | null>(null);
  const [topServices, setTopServices] = useState<NearbyService[] | null>(null);

  // Parse a distance string like "800 m" or "1.2 km" -> kilometers (number)
  const parseDistanceToKm = (s?: string | number): number => {
    if (s == null) return Infinity;
    if (typeof s === 'number') return s;
    const str = String(s).toLowerCase().trim();
    const numMatch = str.match(/\d+[\d,]*(?:\.\d+)?/);
    if (!numMatch) return Infinity;
    const n = Number(numMatch[0].replace(/,/g, ''));
    if (/km/.test(str)) return n;
    if (/m\b/.test(str)) return n / 1000;
    // no unit: assume km if > 10, else treat as meters fallback? safer assume km
    return n;
  };

  const rankServices = (services: NearbyService[] = []): NearbyService[] => {
    return services
      .slice()
      .sort((a, b) => {
        const da = typeof a.distanceKm === 'number' && a.distanceKm > 0 ? a.distanceKm : parseDistanceToKm(a.distance);
        const db = typeof b.distanceKm === 'number' && b.distanceKm > 0 ? b.distanceKm : parseDistanceToKm(b.distance);
        return da - db;
      })
      .slice(0, 3);
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please upload an image smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-product", {
        body: { imageBase64: image, userLocation: location || undefined }
      });

      if (fnError) throw fnError;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data as AnalysisResponse);
      
      // Prepare mapped services but don't auto-trigger parent — wait for user action
      if (data.repairServices) {
        const mapped: NearbyService[] = (data.repairServices || []).map((s: any) => ({
          id: s.id || `ai-${Math.random().toString(36).slice(2,9)}`,
          name: s.name || 'Unknown',
          address: s.address || 'Address not available',
          lat: typeof s.lat === 'number' ? s.lat : Number(s.lat) || 0,
          lon: typeof s.lon === 'number' ? s.lon : Number(s.lon) || 0,
          distance: s.distance || 'N/A',
          distanceKm: typeof s.distanceKm === 'number' ? s.distanceKm : 0,
          type: s.type || 'repair',
          phone: s.phone,
        }));
        setMappedServices(mapped);
        // compute and store top 3 recommended centers for this product
        setTopServices(rankServices(mapped));
      } else {
        setMappedServices(null);
        setTopServices(null);
      }

      toast({
        title: "Analysis Complete",
        description: `We recommend to ${data.analysis.recommendation} your ${data.analysis.productName}`,
      });
    } catch (err) {
      console.error("Analysis error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze image";
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
    setError(null);
    onRecommendations?.([]);
  };

  return (
    <Card className="overflow-hidden border-2 border-dashed border-primary/20 bg-gradient-to-br from-secondary/30 to-background">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Product Analyzer
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a photo of your damaged item and our AI will help you decide whether to repair or replace it
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.label
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="flex gap-2">
                  <Upload className="h-8 w-8" />
                  <Camera className="h-8 w-8" />
                </div>
                <span className="text-sm font-medium">Drop an image or click to upload</span>
                <span className="text-xs">Supports JPG, PNG, WebP up to 10MB</span>
              </div>
            </motion.label>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative"
            >
              <img
                src={image}
                alt="Uploaded product"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {image && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter your city or zip code (optional)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full"
              variant="hero"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Product
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Analysis Failed</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleAnalyze}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 pt-4 border-t"
            >
              {/* Product Info */}
               <div className="flex items-start justify-between gap-4">
                 <div>
                   <h3 className="font-semibold text-lg">{result.analysis.productName}</h3>
                   <div className="flex gap-2 mt-1">
                     <Badge variant="secondary">{result.analysis.category}</Badge>
                    <Badge variant="outline">{Math.round(result.analysis.confidence * 100)}% confident</Badge>
                   </div>
                 </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={result.analysis.recommendation === "repair" ? "default" : "destructive"}
                    className="text-sm px-3 py-1"
                  >
                    {result.analysis.recommendation === "repair" ? (
                      <><Wrench className="h-3 w-3 mr-1" /> Repair</>
                    ) : (
                      <><ShoppingCart className="h-3 w-3 mr-1" /> Replace</>
                    )}
                  </Badge>
                  {result.analysis.recommendation === "repair" && (
                    mappedServices && mappedServices.length > 0 ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (onRecommendations) {
                            // prefer sending top 3 recommendations to parent
                            onRecommendations(topServices && topServices.length > 0 ? topServices : mappedServices);
                          }
                        }}
                      >
                        Show Nearby Repair Centers
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Fallback: ask parent to run a nearby search using detected category or provided location
                          if (onRequestSearch) {
                            onRequestSearch(result.analysis.category, location, result.analysis.productName);
                          }
                        }}
                      >
                        Search Nearby Repair Centers
                      </Button>
                    )
                  )}
                </div>
               </div>

               {/* Condition & Reasoning */}
               <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Condition:</span>{" "}
                  <span className="text-muted-foreground">{result.analysis.condition}</span>
                </p>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{(result.analysis.reasoning || '').split('.').slice(0,2).join('. ')}</p>
                </div>
               </div>

               {/* Cost Estimates */}
               <div className="grid grid-cols-2 gap-3">
                {result.analysis.repairEstimate && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Estimated Repair Cost</p>
                    <p className="font-semibold text-primary">{formatAsINR(result.analysis.repairEstimate)}</p>
                  </div>
                )}
                 {result.analysis.replacementPriceRange && (
                   <div className="p-3 rounded-lg bg-muted border">
                     <p className="text-xs text-muted-foreground mb-1">Replacement Cost</p>
                     <p className="font-semibold">
                       {formatAsINR(result.analysis.replacementPriceRange.min)} - {formatAsINR(result.analysis.replacementPriceRange.max)}
                     </p>
                   </div>
                 )}
               </div>

              {/* Repair Services */}
              {result.analysis.recommendation === "repair" && result.repairServices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Nearby Repair Services
                  </h4>
                  <div className="space-y-2">
                    {result.repairServices.slice(0, 3).map((service) => (
                      <a
                        key={service.id}
                        href={`https://www.openstreetmap.org/?mlat=${service.lat}&mlon=${service.lon}#map=17/${service.lat}/${service.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{service.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{service.address}</p>
                        </div>
                        <Badge variant="outline" className="ml-2 flex-shrink-0">
                          {service.distance}
                        </Badge>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Replacement Suggestions */}
              {result.analysis.recommendation === "replace" && result.analysis.suggestedProducts && result.analysis.suggestedProducts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    Suggested Replacements
                  </h4>
                  <div className="space-y-2">
                    {result.analysis.suggestedProducts.map((product, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <p className="font-medium text-sm">{product.name}</p>
                        <Badge variant="secondary">{formatAsINR(product.priceRange)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concise Analysis Summary (required output format) */}
              <div className="p-4 bg-card rounded-lg border mt-3">
                <h4 className="font-medium mb-2">Quick Summary</h4>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Product:</strong> {result.analysis.productName || 'Unknown'} ({result.analysis.category || 'Unknown'})</p>
                  <p className="mt-1"><strong>Damage:</strong> {(result.analysis.condition || 'Not detected').split('.').slice(0,1).join('. ')}</p>
                  <p className="mt-1"><strong>Estimate:</strong> {result.analysis.repairEstimate ? formatAsINR(result.analysis.repairEstimate) : (result.analysis.replacementPriceRange ? `${formatAsINR(result.analysis.replacementPriceRange.min)} - ${formatAsINR(result.analysis.replacementPriceRange.max)}` : 'N/A')}</p>
                  <p className="mt-1"><strong>Recommendation:</strong> {result.analysis.recommendation === 'repair' ? 'Repair' : 'Replace'}</p>
                  <div className="mt-2">
                    <strong>Nearby centers:</strong>
                    {result.repairServices && result.repairServices.length > 0 ? (
                      <ul className="ml-5 mt-2 text-sm space-y-1">
                        {result.repairServices.slice(0,3).map((s) => (
                          <li key={s.id} className="truncate">
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-muted-foreground">{s.address || 'Address not available'} • {s.distance || 'N/A'}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-muted-foreground mt-2">No AI-found centers. Use the button above to search nearby centers.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top 3 Recommendations */}
               {topServices && topServices.length > 0 && (
                 <div className="space-y-2">
                   <h4 className="font-medium flex items-center gap-2">
                     <Wrench className="h-4 w-4 text-primary" />
                     Top 3 Recommended Repair Centers
                   </h4>
                   <div className="space-y-2">
                     {topServices.map((s) => (
                       <a
                         key={s.id}
                         href={`https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=17/${s.lat}/${s.lon}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:bg-secondary/30 transition-colors"
                       >
                         <div className="flex-1 min-w-0">
                           <p className="font-medium text-sm truncate">{s.name}</p>
                           <p className="text-xs text-muted-foreground truncate">{s.address}</p>
                         </div>
                         <Badge variant="outline" className="ml-2 flex-shrink-0">
                           {typeof s.distanceKm === 'number' && s.distanceKm > 0 ? (s.distanceKm < 1 ? `${Math.round(s.distanceKm*1000)} m` : `${s.distanceKm.toFixed(1)} km`) : (s.distance || 'N/A')}
                         </Badge>
                       </a>
                     ))}
                   </div>
                 </div>
               )}

              {/* Action Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={clearImage}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Analyze Another Product
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
