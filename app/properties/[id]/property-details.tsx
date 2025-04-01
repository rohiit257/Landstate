'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, DollarSign, Home, Mail, Phone, User, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  address: string;
  images: string[];
  owner_id: string;
  latitude?: number;
  longitude?: number;
}

interface PropertyDetailsProps {
  id: string;
}

// Simple static map component
function StaticMap({ coordinates }: { coordinates: [number, number] }) {
  const [lat, lng] = coordinates;
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x400&markers=color:red%7C${lat},${lng}&key=YOUR_GOOGLE_MAPS_API_KEY`;
  
  // Alternative using OpenStreetMap static map
  const osmMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&marker=${lat}%2C${lng}&layer=mapnik`;
  
  return (
    <div className="w-full h-[400px] relative bg-gray-100 rounded-lg overflow-hidden">
      <iframe 
        src={osmMapUrl} 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        style={{ border: 0 }} 
        allowFullScreen 
        aria-hidden="false" 
        tabIndex={0}
        title="Property Location"
      />
    </div>
  );
}

export default function PropertyDetails({ id }: PropertyDetailsProps) {
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch property details
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (propertyError) throw propertyError;
        console.log('Property Data:', propertyData);
        setProperty(propertyData);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setCurrentUser(user);

        // Pre-fill email if user is logged in
        if (user?.email) {
          setContactEmail(user.email);
        }

        // If property has coordinates, set them
        if (propertyData.latitude && propertyData.longitude) {
          console.log('Using stored coordinates:', propertyData.latitude, propertyData.longitude);
          setCoordinates([propertyData.latitude, propertyData.longitude]);
        } else if (propertyData.address) {
          // Geocode the address if coordinates are not available
          try {
            console.log('Geocoding address:', propertyData.address);
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(propertyData.address)}`
            );
            const data = await response.json();
            console.log('Geocoding response:', data);
            if (data && data[0]) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              console.log('Setting coordinates from geocoding:', lat, lon);
              setCoordinates([lat, lon]);
            }
          } catch (error) {
            console.error('Error geocoding address:', error);
          }
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to submit an application');
      }

      if (currentUser.id === property?.owner_id) {
        throw new Error('You cannot apply to your own property');
      }

      // Create application
      const { error: applicationError } = await supabase
        .from('property_applications')
        .insert([
          {
            property_id: id,
            applicant_id: currentUser.id,
            email: contactEmail,
            phone: contactPhone,
            message: message,
          }
        ]);

      if (applicationError) throw applicationError;

      toast({
        title: "Application Submitted",
        description: "Your application has been sent to the property owner.",
      });

      // Clear form
      setMessage('');
      setContactPhone('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: Property not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Property Images */}
        <div className="space-y-4">
          <div className="aspect-video rounded-lg overflow-hidden">
            <img
              src={property.images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3'}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {property.images.slice(1).map((image, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden">
                <img src={image} alt={`${property.title} ${index + 2}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Property Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
            <p className="text-2xl font-bold text-primary">${property.price.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              <span>{property.bedrooms} beds</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <span>{property.bathrooms} baths</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span>{property.square_feet.toLocaleString()} sqft</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{property.description}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Location</h2>
            <p className="text-muted-foreground mb-4">{property.address}</p>
          </div>

          {/* Application Form */}
          {currentUser && currentUser.id !== property.owner_id ? (
            <Card>
              <CardHeader>
                <CardTitle>Apply for this Property</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <Input
                        type="email"
                        placeholder="Your email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <Input
                        type="tel"
                        placeholder="Your phone number"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <Textarea
                        placeholder="Tell us why you're interested in this property..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                {!currentUser ? (
                  <div className="text-center">
                    <p className="mb-4">Please log in to apply for this property</p>
                    <Button asChild>
                      <a href="/auth/login">Log In</a>
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    This is your property listing
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Map Section - Full Width Below Details */}
      {coordinates && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Property Location</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full h-[400px]">
                <StaticMap coordinates={coordinates} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}