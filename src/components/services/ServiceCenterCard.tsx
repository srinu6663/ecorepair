import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, Navigation, Wrench } from "lucide-react";

export interface ServiceCenter {
  id: string;
  name: string;
  address: string;
  phone?: string;
  distance: string;
  distanceKm?: number;
  type: string;
  lat: number;
  lon: number;
  operatingHours?: string;
  services?: string[];
}

interface ServiceCenterCardProps {
  service: ServiceCenter;
}

export function ServiceCenterCard({ service }: ServiceCenterCardProps) {
  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${service.lat},${service.lon}`;
    window.open(url, "_blank");
  };

  const handleCall = () => {
    if (service.phone) {
      window.location.href = `tel:${service.phone}`;
    }
  };

  // Format service type for display
  const formatServiceType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Format distance (use numeric km when available for accuracy)
  const formatDistanceDisplay = (km?: number, fallback?: string) => {
    if (typeof km === "number") {
      if (km < 1) return `${Math.round(km * 1000)} m`;
      return `${km.toFixed(1)} km`;
    }
    return fallback || "N/A";
  };

  const displayDistance = formatDistanceDisplay(service.distanceKm, service.distance);

  // Generate mock operating hours if not available
  const operatingHours = service.operatingHours || "Mon-Fri: 9AM-6PM, Sat: 10AM-4PM";

  // Generate mock services based on type if not available
  const servicesList = service.services || getDefaultServices(service.type);

  return (
    <Card hover className="h-full">
      <CardContent className="p-6">
        {/* Header with name and distance */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg font-semibold truncate">
              {service.name}
            </h3>
            <Badge variant="outline" className="mt-1 text-xs capitalize">
              {formatServiceType(service.type)}
            </Badge>
          </div>
          <Badge variant="secondary" className="flex-shrink-0 ml-2">
            {displayDistance}
          </Badge>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 mb-3 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{service.address}</span>
        </div>

        {/* Phone */}
        {service.phone && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a
              href={`tel:${service.phone}`}
              className="text-primary hover:underline"
            >
              {service.phone}
            </a>
          </div>
        )}

        {/* Operating Hours */}
        <div className="flex items-start gap-2 mb-3 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{operatingHours}</span>
        </div>

        {/* Services Offered */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium">
            <Wrench className="h-4 w-4" />
            <span>Services Offered</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {servicesList.slice(0, 4).map((svc, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {svc}
              </Badge>
            ))}
            {servicesList.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{servicesList.length - 4} more
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={handleGetDirections}
          >
            <Navigation className="h-4 w-4 mr-1.5" />
            Get Directions
          </Button>
          {service.phone ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCall}
            >
              <Phone className="h-4 w-4 mr-1.5" />
              Call Now
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled
            >
              <Phone className="h-4 w-4 mr-1.5" />
              No Phone
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to generate default services based on type
function getDefaultServices(type: string): string[] {
  const serviceMap: Record<string, string[]> = {
    electronics: ["Screen Repair", "Battery Replacement", "Diagnostics", "Component Repair"],
    mobile_phone: ["Screen Replacement", "Battery Service", "Water Damage Repair", "Software Issues"],
    computer: ["Hardware Repair", "Data Recovery", "Virus Removal", "Upgrades"],
    electronics_repair: ["Soldering", "PCB Repair", "Component Testing", "Refurbishment"],
    tailor: ["Alterations", "Hemming", "Zipper Repair", "Custom Fitting"],
    shoemaker: ["Sole Replacement", "Heel Repair", "Leather Restoration", "Stretching"],
    bicycle: ["Tune-ups", "Brake Service", "Wheel Truing", "Gear Adjustment"],
    bicycle_repair_station: ["Basic Repairs", "Tire Inflation", "Chain Fixes"],
    appliance: ["Refrigerator Repair", "Washer Service", "Dryer Repair", "Dishwasher Fix"],
    watchmaker: ["Battery Replacement", "Band Repair", "Movement Service", "Crystal Replace"],
    hardware: ["Tool Repair", "Key Cutting", "Sharpening", "Equipment Service"],
    repair: ["General Repairs", "Diagnostics", "Maintenance"],
  };

  return serviceMap[type] || serviceMap.repair;
}
