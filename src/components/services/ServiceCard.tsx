import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, CheckCircle } from "lucide-react";
import { RepairService } from "@/data/repairServices";

interface ServiceCardProps {
  service: RepairService;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card hover className="h-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heading text-lg font-semibold">{service.name}</h3>
              {service.verified && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{service.address}, {service.city}</span>
            </div>
          </div>
          {service.distance !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {service.distance} mi
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-medium">{service.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({service.reviewCount} reviews)
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {service.specialties.slice(0, 3).map((specialty) => (
            <Badge key={specialty} variant="outline" className="text-xs">
              {specialty}
            </Badge>
          ))}
          {service.specialties.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{service.specialties.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="default" className="flex-1" size="sm">
            <Phone className="h-4 w-4 mr-1" />
            Contact
          </Button>
          <Button variant="outline" size="sm">
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
