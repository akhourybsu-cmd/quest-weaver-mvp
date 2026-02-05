 import { useState } from "react";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import { Sparkles, Loader2 } from "lucide-react";
 import { AssetType } from "@/hooks/useAIAssetGenerator";
 
 interface AIGenerationPromptDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onGenerate: (prompt?: string) => void;
   isGenerating: boolean;
   assetType: AssetType;
 }
 
 const ASSET_TYPE_LABELS: Record<AssetType, string> = {
   npc: "NPC",
   location: "Location",
   faction: "Faction",
   item: "Item",
   quest: "Quest",
   lore: "Lore Entry",
 };
 
 const EXAMPLE_PROMPTS: Record<AssetType, string[]> = {
   npc: [
     "Make them a secret villain",
     "They should have a mysterious past",
     "A friendly merchant with hidden depths",
   ],
   location: [
     "Make it feel ancient and magical",
     "Add a dark secret to this place",
     "It should feel welcoming but have hidden dangers",
   ],
   faction: [
     "They pretend to be good but are secretly evil",
     "A shadowy organization with noble goals",
     "Make them morally ambiguous",
   ],
   item: [
     "Give it a cursed history",
     "It was forged by a legendary smith",
     "Add an interesting quirk",
   ],
   quest: [
     "Include a moral dilemma",
     "Add a surprising twist",
     "Make it time-sensitive",
   ],
   lore: [
     "Connect it to ancient history",
     "Add mystery and intrigue",
     "Include a prophecy element",
   ],
 };
 
 export function AIGenerationPromptDialog({
   open,
   onOpenChange,
   onGenerate,
   isGenerating,
   assetType,
 }: AIGenerationPromptDialogProps) {
   const [prompt, setPrompt] = useState("");
 
   const handleGenerate = () => {
     onGenerate(prompt.trim() || undefined);
     setPrompt("");
   };
 
   const handleQuickPrompt = (quickPrompt: string) => {
     setPrompt(quickPrompt);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-lg">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Sparkles className="w-5 h-5 text-primary" />
             Generate {ASSET_TYPE_LABELS[assetType]} with AI
           </DialogTitle>
           <DialogDescription>
             AI will fill in empty fields while preserving any values you've already entered.
             Optionally, provide guidance for the AI.
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label htmlFor="prompt">Optional Guidance</Label>
             <Textarea
               id="prompt"
               placeholder="e.g., Make this NPC a secret villain with connections to the Shadow Cult..."
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               className="min-h-[100px]"
             />
           </div>
 
           <div className="space-y-2">
             <Label className="text-sm text-muted-foreground">Quick ideas:</Label>
             <div className="flex flex-wrap gap-2">
               {EXAMPLE_PROMPTS[assetType].map((example) => (
                 <Button
                   key={example}
                   type="button"
                   variant="secondary"
                   size="sm"
                   onClick={() => handleQuickPrompt(example)}
                   className="text-xs"
                 >
                   {example}
                 </Button>
               ))}
             </div>
           </div>
         </div>
 
         <DialogFooter>
           <Button
             type="button"
             variant="outline"
             onClick={() => onOpenChange(false)}
             disabled={isGenerating}
           >
             Cancel
           </Button>
           <Button
             type="button"
             onClick={handleGenerate}
             disabled={isGenerating}
           >
             {isGenerating ? (
               <>
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 Generating...
               </>
             ) : (
               <>
                 <Sparkles className="w-4 h-4 mr-2" />
                 Generate
               </>
             )}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }