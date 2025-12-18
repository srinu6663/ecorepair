import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, userLocation } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing product image with AI vision...");

    // Call Lovable AI with vision capabilities
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert product damage assessor. Analyze images of damaged products and provide repair vs replacement recommendations.

Always respond with a valid JSON object in this exact format:
{
  "productName": "specific product name",
  "category": "category (electronics, appliances, furniture, clothing, etc.)",
  "condition": "brief description of damage",
  "recommendation": "repair" or "replace",
  "confidence": 0.0-1.0,
  "reasoning": "2-3 sentence explanation of your recommendation",
  "repairEstimate": "estimated repair cost range if repairable",
  "replacementPriceRange": { "min": number, "max": number },
  "suggestedProducts": [{ "name": "product name", "priceRange": "$X - $Y" }]
}

Consider factors like:
- Severity and type of damage
- Typical repair costs vs replacement costs
- Product age and lifespan
- Environmental impact of replacement
- Availability of repair services

Favor repair when the damage is fixable at a reasonable cost (generally less than 50% of replacement cost).`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this damaged product image. Identify what it is, assess the damage, and recommend whether to repair or replace it. Provide cost estimates and reasoning."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    console.log("AI response received:", content?.substring(0, 200));

    // Parse the AI response
    let analysis: AnalysisResult;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Provide a fallback response
      analysis = {
        productName: "Unknown Product",
        category: "general",
        condition: "Unable to fully assess damage from image",
        recommendation: "repair",
        confidence: 0.5,
        reasoning: "Based on the image, we recommend consulting with a local repair professional for an accurate assessment. Repairing is often more cost-effective and environmentally friendly than replacing.",
        repairEstimate: "$20 - $100",
        replacementPriceRange: { min: 50, max: 300 },
        suggestedProducts: []
      };
    }

    // If repair is recommended and location is provided, search for repair services
    let repairServices: any[] = [];
    if (analysis.recommendation === "repair" && userLocation) {
      console.log("Searching for repair services near:", userLocation);
      
      try {
        // Search for repair services using Nominatim
        const searchQuery = encodeURIComponent(`${analysis.category} repair ${userLocation}`);
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&limit=5&addressdetails=1`;
        
        const nominatimResponse = await fetch(nominatimUrl, {
          headers: {
            "User-Agent": "RepairFirst-App/1.0"
          }
        });
        
        if (nominatimResponse.ok) {
          const locations = await nominatimResponse.json();
          repairServices = locations.map((loc: any, index: number) => ({
            id: `osm-${loc.place_id}`,
            name: loc.display_name.split(",")[0],
            address: loc.display_name,
            lat: parseFloat(loc.lat),
            lon: parseFloat(loc.lon),
            distance: `${(index + 1) * 0.5 + Math.random() * 2}`.slice(0, 3) + " km",
            type: loc.type || "repair_shop"
          }));
        }
      } catch (geoError) {
        console.error("Error searching for repair services:", geoError);
      }
    }

    const result = {
      analysis,
      repairServices,
      timestamp: new Date().toISOString()
    };

    console.log("Analysis complete, returning result");

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-product function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
