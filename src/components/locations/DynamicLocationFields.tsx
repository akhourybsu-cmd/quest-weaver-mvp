import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import { LOCATION_SCHEMAS, LocationType } from "@/lib/locationSchemas";

interface DynamicLocationFieldsProps {
  locationType: LocationType;
  details: Record<string, any>;
  onDetailsChange: (details: Record<string, any>) => void;
}

export function DynamicLocationFields({ locationType, details, onDetailsChange }: DynamicLocationFieldsProps) {
  const [arrayInputs, setArrayInputs] = useState<Record<string, string>>({});

  const schema = LOCATION_SCHEMAS[locationType];
  if (!schema || schema.fields.length === 0) return null;

  const handleChange = (key: string, value: any) => {
    onDetailsChange({ ...details, [key]: value });
  };

  const handleArrayAdd = (key: string) => {
    const inputValue = arrayInputs[key]?.trim();
    if (!inputValue) return;

    const currentArray = details[key] || [];
    handleChange(key, [...currentArray, inputValue]);
    setArrayInputs({ ...arrayInputs, [key]: "" });
  };

  const handleArrayRemove = (key: string, index: number) => {
    const currentArray = details[key] || [];
    handleChange(key, currentArray.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-4">
      {schema.fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>
            {field.label}
            {field.description && (
              <span className="text-xs text-muted-foreground ml-2">({field.description})</span>
            )}
          </Label>

          {field.type === "text" && (
            <Input
              id={field.key}
              value={details[field.key] || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="bg-background/50 border-brass/30"
            />
          )}

          {field.type === "number" && (
            <Input
              id={field.key}
              type="number"
              value={details[field.key] || ""}
              onChange={(e) => handleChange(field.key, e.target.value ? parseInt(e.target.value) : null)}
              placeholder={field.placeholder}
              className="bg-background/50 border-brass/30"
            />
          )}

          {field.type === "textarea" && (
            <Textarea
              id={field.key}
              value={details[field.key] || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="bg-background/50 border-brass/30"
            />
          )}

          {field.type === "boolean" && (
            <div className="flex items-center space-x-2">
              <Switch
                id={field.key}
                checked={details[field.key] || false}
                onCheckedChange={(checked) => handleChange(field.key, checked)}
              />
              <span className="text-sm text-muted-foreground">
                {details[field.key] ? "Yes" : "No"}
              </span>
            </div>
          )}

          {field.type === "select" && field.options && (
            <Select
              value={details[field.key] || ""}
              onValueChange={(value) => handleChange(field.key, value)}
            >
              <SelectTrigger className="bg-background/50 border-brass/30">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.type === "array" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={arrayInputs[field.key] || ""}
                  onChange={(e) => setArrayInputs({ ...arrayInputs, [field.key]: e.target.value })}
                  placeholder={`Add ${field.label.toLowerCase()}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleArrayAdd(field.key);
                    }
                  }}
                  className="bg-background/50 border-brass/30"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleArrayAdd(field.key)}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {details[field.key] && details[field.key].length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {details[field.key].map((item: string, index: number) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => handleArrayRemove(field.key, index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
