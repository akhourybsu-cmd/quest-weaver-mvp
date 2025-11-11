import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Hand, UserX } from "lucide-react";
import ContestedCheckDialog from "./ContestedCheckDialog";

interface GrappleShoveMenuProps {
  attackerId: string;
  attackerType: 'character' | 'monster';
  attackerName: string;
  attackerAthleticsBonus: number;
  targets: Array<{
    id: string;
    type: 'character' | 'monster';
    name: string;
    athleticsBonus: number;
    acrobaticsBonus: number;
  }>;
  encounterId: string;
  disabled?: boolean;
}

const GrappleShoveMenu = ({
  attackerId,
  attackerType,
  attackerName,
  attackerAthleticsBonus,
  targets,
  encounterId,
  disabled,
}: GrappleShoveMenuProps) => {
  const [openTargetSelect, setOpenTargetSelect] = useState(false);
  const [checkType, setCheckType] = useState<'grapple' | 'shove' | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [showContestDialog, setShowContestDialog] = useState(false);

  const handleSelectAction = (type: 'grapple' | 'shove') => {
    setCheckType(type);
    setOpenTargetSelect(true);
  };

  const handleConfirmTarget = () => {
    if (selectedTarget && checkType) {
      setOpenTargetSelect(false);
      setShowContestDialog(true);
    }
  };

  const handleSuccess = () => {
    setShowContestDialog(false);
    setSelectedTarget("");
    setCheckType(null);
  };

  const target = targets.find(t => t.id === selectedTarget);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <Hand className="w-4 h-4 mr-2" />
            Grapple/Shove
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleSelectAction('grapple')}>
            <Hand className="w-4 h-4 mr-2" />
            Grapple (Speed 0)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSelectAction('shove')}>
            <UserX className="w-4 h-4 mr-2" />
            Shove (Prone/Push)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Target Selection Dialog */}
      <Dialog open={openTargetSelect} onOpenChange={setOpenTargetSelect}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {checkType === 'grapple' ? 'Grapple Target' : 'Shove Target'}
            </DialogTitle>
            <DialogDescription>
              Select a target within reach (no more than one size larger)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedTarget} onValueChange={setSelectedTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Select target..." />
              </SelectTrigger>
              <SelectContent>
                {targets.map((target) => (
                  <SelectItem key={target.id} value={target.id}>
                    {target.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleConfirmTarget} 
              disabled={!selectedTarget}
              className="w-full"
            >
              Continue to Contest
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contested Check Dialog */}
      {target && checkType && (
        <ContestedCheckDialog
          open={showContestDialog}
          onOpenChange={setShowContestDialog}
          checkType={checkType}
          attackerId={attackerId}
          attackerType={attackerType}
          attackerName={attackerName}
          attackerBonus={attackerAthleticsBonus}
          targetId={target.id}
          targetType={target.type}
          targetName={target.name}
          targetAthleticsBonus={target.athleticsBonus}
          targetAcrobaticsBonus={target.acrobaticsBonus}
          encounterId={encounterId}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};

export default GrappleShoveMenu;
