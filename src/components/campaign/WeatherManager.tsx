import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Cloud, Sun, CloudRain, CloudSnow, CloudFog, Wind } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WeatherManagerProps {
  campaignId: string;
}

const WEATHER_ICONS: Record<string, typeof Cloud> = {
  clear: Sun,
  rain: CloudRain,
  heavy_rain: CloudRain,
  snow: CloudSnow,
  heavy_snow: CloudSnow,
  fog: CloudFog,
  wind: Wind,
  storm: CloudRain,
};

const WEATHER_EFFECTS: Record<string, string> = {
  clear: "No weather effects",
  rain: "Lightly obscured, disadvantage on Perception (hearing). Extinguishes open flames.",
  heavy_rain: "Heavily obscured, disadvantage on Perception. Difficult terrain. Extinguishes open flames.",
  snow: "Lightly obscured, disadvantage on Perception (hearing). Tracks visible.",
  heavy_snow: "Heavily obscured, difficult terrain. Extreme cold effects.",
  fog: "Heavily obscured beyond 5 feet. Disadvantage on ranged attacks.",
  wind: "Disadvantage on ranged weapon attacks. Extinguishes open flames. Flying difficult.",
  storm: "Heavily obscured, difficult terrain, disadvantage on Perception. Lightning risk.",
};

export function WeatherManager({ campaignId }: WeatherManagerProps) {
  const [open, setOpen] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<string | null>(null);
  const [weatherType, setWeatherType] = useState("clear");
  const [temperature, setTemperature] = useState("moderate");

  useEffect(() => {
    const fetchWeather = async () => {
      const { data } = await supabase
        .from('campaign_weather')
        .select('*')
        .eq('campaign_id', campaignId)
        .is('ended_at', null)
        .single();
      
      if (data) {
        setCurrentWeather(data.weather_type);
        setWeatherType(data.weather_type);
        setTemperature(data.temperature || 'moderate');
      }
    };

    fetchWeather();
  }, [campaignId]);

  const handleSetWeather = async () => {
    try {
      // End current weather
      if (currentWeather) {
        await supabase
          .from('campaign_weather')
          .update({ ended_at: new Date().toISOString() })
          .eq('campaign_id', campaignId)
          .is('ended_at', null);
      }

      // Create new weather
      await supabase.from('campaign_weather').insert({
        campaign_id: campaignId,
        weather_type: weatherType,
        temperature,
        effects: { description: WEATHER_EFFECTS[weatherType] },
      });

      setCurrentWeather(weatherType);
      toast.success(`Weather set to ${weatherType.replace('_', ' ')}`);
      setOpen(false);
    } catch (error) {
      console.error('Error setting weather:', error);
      toast.error("Failed to set weather");
    }
  };

  const handleClearWeather = async () => {
    try {
      await supabase
        .from('campaign_weather')
        .update({ ended_at: new Date().toISOString() })
        .eq('campaign_id', campaignId)
        .is('ended_at', null);

      setCurrentWeather(null);
      toast.success("Weather cleared");
    } catch (error) {
      console.error('Error clearing weather:', error);
      toast.error("Failed to clear weather");
    }
  };

  const WeatherIcon = currentWeather ? WEATHER_ICONS[currentWeather] : Cloud;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <WeatherIcon className="w-4 h-4" />
          {currentWeather ? currentWeather.replace('_', ' ') : 'Set Weather'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Manage Weather
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Weather */}
          {currentWeather && (
            <Alert>
              <AlertDescription>
                <div className="font-semibold">Current: {currentWeather.replace('_', ' ')}</div>
                <div className="text-sm mt-1">{WEATHER_EFFECTS[currentWeather]}</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Weather Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Weather Type</label>
            <Select value={weatherType} onValueChange={setWeatherType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear</SelectItem>
                <SelectItem value="rain">Rain</SelectItem>
                <SelectItem value="heavy_rain">Heavy Rain</SelectItem>
                <SelectItem value="snow">Snow</SelectItem>
                <SelectItem value="heavy_snow">Heavy Snow</SelectItem>
                <SelectItem value="fog">Fog</SelectItem>
                <SelectItem value="wind">High Wind</SelectItem>
                <SelectItem value="storm">Storm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Temperature</label>
            <Select value={temperature} onValueChange={setTemperature}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="extreme_cold">Extreme Cold</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="extreme_heat">Extreme Heat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Effects Preview */}
          <Alert>
            <AlertDescription className="text-xs">
              <strong>Effects:</strong> {WEATHER_EFFECTS[weatherType]}
            </AlertDescription>
          </Alert>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSetWeather} className="flex-1">
              Set Weather
            </Button>
            {currentWeather && (
              <Button onClick={handleClearWeather} variant="outline">
                Clear
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
