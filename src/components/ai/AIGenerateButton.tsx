 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Sparkles, Loader2 } from "lucide-react";
 import { useAIAssetGenerator, AssetType, GenerationResult } from "@/hooks/useAIAssetGenerator";
 import { getFilledFieldKeys } from "@/lib/assetFieldSchemas";
 import { AIGenerationPromptDialog } from "./AIGenerationPromptDialog";
 import { AIGenerationPreview } from "./AIGenerationPreview";
 
 interface AIGenerateButtonProps {
   campaignId: string;
   assetType: AssetType;
   getFormValues: () => Record<string, any>;
   onApply: (filledFields: Record<string, any>) => void;
   disabled?: boolean;
   className?: string;
 }
 
 export function AIGenerateButton({
   campaignId,
   assetType,
   getFormValues,
   onApply,
   disabled,
   className,
 }: AIGenerateButtonProps) {
   const [showPromptDialog, setShowPromptDialog] = useState(false);
   const [showPreviewDialog, setShowPreviewDialog] = useState(false);
   const [currentValues, setCurrentValues] = useState<Record<string, any>>({});
   
   const { isGenerating, lastResult, generate, clearResult } = useAIAssetGenerator({
     campaignId,
     assetType,
   });
 
   const handleClick = () => {
     const values = getFormValues();
     setCurrentValues(values);
     setShowPromptDialog(true);
   };
 
   const handleGenerate = async (userPrompt?: string) => {
     const values = getFormValues();
     setCurrentValues(values);
     const lockedFields = getFilledFieldKeys(values);
     
     setShowPromptDialog(false);
     
     const result = await generate(values, lockedFields, userPrompt);
     
     if (result && Object.keys(result.filled_fields).length > 0) {
       setShowPreviewDialog(true);
     }
   };
 
   const handleApply = (selectedFields: Record<string, any>) => {
     onApply(selectedFields);
     setShowPreviewDialog(false);
     clearResult();
   };
 
   const handleCancel = () => {
     setShowPreviewDialog(false);
     clearResult();
   };
 
   return (
     <>
       <Button
         type="button"
         variant="outline"
         size="sm"
         onClick={handleClick}
         disabled={disabled || isGenerating}
         className={className}
       >
         {isGenerating ? (
           <>
             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
             Generating...
           </>
         ) : (
           <>
             <Sparkles className="w-4 h-4 mr-2" />
             Generate with AI
           </>
         )}
       </Button>
 
       <AIGenerationPromptDialog
         open={showPromptDialog}
         onOpenChange={setShowPromptDialog}
         onGenerate={handleGenerate}
         isGenerating={isGenerating}
         assetType={assetType}
       />
 
       {lastResult && (
         <AIGenerationPreview
           open={showPreviewDialog}
           onOpenChange={setShowPreviewDialog}
           result={lastResult}
           currentValues={currentValues}
           assetType={assetType}
           onApply={handleApply}
           onCancel={handleCancel}
         />
       )}
     </>
   );
 }