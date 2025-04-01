'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, DollarSign, Home, ImageIcon, MapPin, Search } from 'lucide-react';

interface FormData {
  title: string;
  description: string;
  price: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  images: string[];
}

interface Location {
  display_name: string;
  lat: string;
  lon: string;
}

export default function NewProperty() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    address: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    images: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout>();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const searchLocations = async () => {
      if (!searchQuery.trim()) {
        setLocations([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
          {
            headers: {
              'Accept-Language': 'en-US,en;q=0.9',
            },
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        
        const data = await response.json();
        setLocations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error searching locations:', error);
        setLocations([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search to avoid too many API calls
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(searchLocations, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to create a property');
      }

      // Convert string values to appropriate types
      const propertyData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        address: formData.address,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        square_feet: parseFloat(formData.square_feet),
        images: formData.images.filter(url => url.trim() !== ''),
        owner_id: user.id,
      };

      const { error: insertError } = await supabase
        .from('properties')
        .insert([propertyData]);

      if (insertError) throw insertError;

      router.push('/properties');
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'images') {
      setFormData(prev => ({
        ...prev,
        images: value.split(',').map(url => url.trim()).filter(url => url !== '')
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLocationSelect = (location: Location) => {
    setFormData(prev => ({
      ...prev,
      address: location.display_name,
    }));
    setSearchQuery(location.display_name);
    setShowSuggestions(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>List a New Property</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Property Title
                </label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Beautiful House in Downtown"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your property..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">
                  Price
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="299999"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="Search for an address..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-9"
                    required
                  />
                  {showSuggestions && (searchQuery.trim() || isLoading) && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                      {isLoading ? (
                        <div className="p-2 text-sm text-gray-500">Searching...</div>
                      ) : locations.length > 0 ? (
                        locations.map((location) => (
                          <button
                            key={`${location.lat}-${location.lon}`}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                            onClick={() => handleLocationSelect(location)}
                          >
                            <Search className="mr-2 h-4 w-4 text-gray-500" />
                            <span className="text-sm">{location.display_name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">No locations found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="bedrooms" className="text-sm font-medium">
                    Bedrooms
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      placeholder="3"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="bathrooms" className="text-sm font-medium">
                    Bathrooms
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      placeholder="2"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="square_feet" className="text-sm font-medium">
                    Square Feet
                  </label>
                  <Input
                    id="square_feet"
                    name="square_feet"
                    type="number"
                    placeholder="2000"
                    value={formData.square_feet}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="images" className="text-sm font-medium">
                  Image URLs
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="images"
                    name="images"
                    placeholder="Enter image URLs separated by commas"
                    value={formData.images.join(',')}
                    onChange={handleChange}
                    className="pl-9"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Add multiple image URLs separated by commas
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Property'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}