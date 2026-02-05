 import { useState, useMemo } from "react";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
 import { ChevronDown, ChevronRight, CheckCircle, AlertTriangle, Info, Sparkles } from "lucide-react";
 import { GenerationResult, AssetType } from "@/hooks/useAIAssetGenerator";
 import { ASSET_FIELD_SCHEMAS } from "@/lib/assetFieldSchemas";
 import { cn } from "@/lib/utils";
 
 interface AIGenerationPreviewProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   result: GenerationResult;
   currentValues: Record<string, any>;
   assetType: AssetType;
   onApply: (selectedFields: Record<string, any>) => void;
   onCancel: () => void;
 }
 
 export function AIGenerationPreview({
   open,
   onOpenChange,
   result,
   currentValues,
   assetType,
   onApply,
   onCancel,
 }: AIGenerationPreviewProps) {
   const [selectedFields, setSelectedFields] = useState<Set<string>>(
     new Set(Object.keys(result.filled_fields))
   );
   const [showAssumptions, setShowAssumptions] = useState(false);
   const [showChecks, setShowChecks] = useState(false);
 
   const schema = ASSET_FIELD_SCHEMAS[assetType];
 
   const getFieldLabel = (key: string): string => {
     const field = schema.find(f => f.key === key);
     return field?.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
   };
 
   const toggleField = (key: string) => {
     const newSelected = new Set(selectedFields);
     if (newSelected.has(key)) {
       newSelected.delete(key);
     } else {
       newSelected.add(key);
     }
     setSelectedFields(newSelected);
   };
 
   const selectAll = () => {
     setSelectedFields(new Set(Object.keys(result.filled_fields)));
   };
 
   const selectNone = () => {
     setSelectedFields(new Set());
   };
 
   const handleApply = () => {
     const fieldsToApply: Record<string, any> = {};
     for (const key of selectedFields) {
       if (result.filled_fields[key] !== undefined) {
         fieldsToApply[key] = result.filled_fields[key];
       }
     }
     onApply(fieldsToApply);
   };
 
   const formatValue = (value: any): string => {
     if (Array.isArray(value)) {
       return value.join("\n• ");
     }
     if (typeof value === 'object' && value !== null) {
       return JSON.stringify(value, null, 2);
     }
     return String(value);
   };
 
   const hasConflicts = result.consistency_checks.some(c => c.result === 'potential_conflict');
   const hasAdjustments = result.consistency_checks.some(c => c.result === 'adjusted');
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Sparkles className="w-5 h-5 text-primary" />
             AI Generated Content
           </DialogTitle>
           <DialogDescription>
             Review and select which suggestions to apply. Your existing values are preserved.
           </DialogDescription>
         </DialogHeader>
 
         <ScrollArea className="flex-1 pr-4">
           <div className="space-y-6 py-4">
             {/* Field Suggestions */}
             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <h4 className="font-medium">Suggested Fields</h4>
                 <div className="flex gap-2">
                   <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
                     Select All
                   </Button>
                   <Button type="button" variant="ghost" size="sm" onClick={selectNone}>
                     Select None
                   </Button>
                 </div>
               </div>
 
               <div className="space-y-3">
                 {Object.entries(result.filled_fields).map(([key, value]) => {
                   const isSelected = selectedFields.has(key);
                   const existingValue = currentValues[key];
                   const hasExisting = existingValue && 
                     (typeof existingValue === 'string' ? existingValue.trim() : true);
 
                   return (
                     <div
                       key={key}
                       className={cn(
                         "rounded-lg border p-3 transition-colors",
                         isSelected ? "border-primary/50 bg-primary/5" : "border-border"
                       )}
                     >
                       <div className="flex items-start gap-3">
                         <Checkbox
                           id={key}
                           checked={isSelected}
                           onCheckedChange={() => toggleField(key)}
                           className="mt-1"
                         />
                         <div className="flex-1 space-y-1">
                           <label
                             htmlFor={key}
                             className="font-medium cursor-pointer flex items-center gap-2"
                           >
                             {getFieldLabel(key)}
                             {hasExisting && (
                               <Badge variant="outline" className="text-xs">
                                 Has existing value
                               </Badge>
                             )}
                           </label>
                           <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                             {Array.isArray(value) ? (
                               <ul className="list-disc list-inside space-y-1">
                                 {value.map((item, i) => (
                                   <li key={i}>{item}</li>
                                 ))}
                               </ul>
                             ) : typeof value === 'object' ? (
                               <pre className="text-xs bg-muted p-2 rounded">
                                 {JSON.stringify(value, null, 2)}
                               </pre>
                             ) : (
                               value
                             )}
                           </div>
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
 
             {/* Assumptions */}
             {result.assumptions.length > 0 && (
               <Collapsible open={showAssumptions} onOpenChange={setShowAssumptions}>
                 <CollapsibleTrigger asChild>
                   <Button variant="ghost" className="w-full justify-between p-2">
                     <span className="flex items-center gap-2">
                       <Info className="w-4 h-4" />
                       Assumptions Made ({result.assumptions.length})
                     </span>
                     {showAssumptions ? (
                       <ChevronDown className="w-4 h-4" />
                     ) : (
                       <ChevronRight className="w-4 h-4" />
                     )}
                   </Button>
                 </CollapsibleTrigger>
                 <CollapsibleContent className="px-2">
                   <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                     {result.assumptions.map((assumption, i) => (
                       <li key={i}>{assumption}</li>
                     ))}
                   </ul>
                 </CollapsibleContent>
               </Collapsible>
             )}
 
             {/* Consistency Checks */}
             {result.consistency_checks.length > 0 && (
               <Collapsible open={showChecks} onOpenChange={setShowChecks}>
                 <CollapsibleTrigger asChild>
                   <Button variant="ghost" className="w-full justify-between p-2">
                     <span className="flex items-center gap-2">
                       {hasConflicts ? (
                         <AlertTriangle className="w-4 h-4 text-yellow-500" />
                       ) : (
                         <CheckCircle className="w-4 h-4 text-green-500" />
                       )}
                       Consistency Checks ({result.consistency_checks.length})
                       {hasConflicts && (
                         <Badge variant="destructive" className="text-xs">
                           Has conflicts
                         </Badge>
                       )}
                       {hasAdjustments && !hasConflicts && (
                         <Badge variant="secondary" className="text-xs">
                           Adjusted
                         </Badge>
                       )}
                     </span>
                     {showChecks ? (
                       <ChevronDown className="w-4 h-4" />
                     ) : (
                       <ChevronRight className="w-4 h-4" />
                     )}
                   </Button>
                 </CollapsibleTrigger>
                 <CollapsibleContent className="px-2 space-y-2">
                   {result.consistency_checks.map((check, i) => (
                     <div
                       key={i}
                       className={cn(
                         "p-2 rounded text-sm",
                         check.result === 'pass' && "bg-green-500/10",
                         check.result === 'adjusted' && "bg-yellow-500/10",
                         check.result === 'potential_conflict' && "bg-red-500/10"
                       )}
                     >
                       <div className="flex items-center gap-2 font-medium">
                         {check.result === 'pass' && <CheckCircle className="w-4 h-4 text-green-500" />}
                         {check.result === 'adjusted' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                         {check.result === 'potential_conflict' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                         {check.check}
                       </div>
                       <p className="text-muted-foreground ml-6">{check.details}</p>
                     </div>
                   ))}
                 </CollapsibleContent>
               </Collapsible>
             )}
           </div>
         </ScrollArea>
 
         <DialogFooter className="gap-2">
           <Button type="button" variant="outline" onClick={onCancel}>
             Cancel
           </Button>
           <Button
             type="button"
             onClick={handleApply}
             disabled={selectedFields.size === 0}
           >
             Apply {selectedFields.size} Field{selectedFields.size !== 1 ? 's' : ''}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }