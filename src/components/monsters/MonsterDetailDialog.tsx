import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface MonsterDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monster: any;
}

const MonsterDetailDialog = ({ open, onOpenChange, monster }: MonsterDetailDialogProps) => {
  if (!monster) return null;

  const calculateModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const renderAbilityScores = () => (
    <div className="grid grid-cols-6 gap-2 text-center text-sm">
      {['str', 'dex', 'con', 'int', 'wis', 'cha'].map((ability) => (
        <div key={ability} className="border rounded-lg p-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase">{ability}</div>
          <div className="font-bold text-lg">{monster.abilities[ability]}</div>
          <div className="text-xs text-muted-foreground">{calculateModifier(monster.abilities[ability])}</div>
        </div>
      ))}
    </div>
  );

  const renderTraits = () => {
    if (!monster.traits || monster.traits.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Traits</h4>
        {monster.traits.map((trait: any, idx: number) => (
          <div key={idx} className="text-sm">
            <span className="font-semibold italic">{trait.name}.</span>{' '}
            <span className="text-muted-foreground">{trait.desc}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderActions = () => {
    if (!monster.actions || monster.actions.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-destructive">Actions</h4>
        {monster.actions.map((action: any, idx: number) => (
          <div key={idx} className="text-sm">
            <span className="font-semibold italic">{action.name}.</span>{' '}
            <span className="text-muted-foreground">{action.desc}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderReactions = () => {
    if (!monster.reactions || monster.reactions.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Reactions</h4>
        {monster.reactions.map((reaction: any, idx: number) => (
          <div key={idx} className="text-sm">
            <span className="font-semibold italic">{reaction.name}.</span>{' '}
            <span className="text-muted-foreground">{reaction.desc}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderLegendaryActions = () => {
    if (!monster.legendary_actions || monster.legendary_actions.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-amber-500">Legendary Actions</h4>
        {monster.legendary_actions.map((action: any, idx: number) => (
          <div key={idx} className="text-sm">
            <span className="font-semibold italic">{action.name}.</span>{' '}
            <span className="text-muted-foreground">{action.desc}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{monster.display_name || monster.name}</DialogTitle>
          <p className="text-sm text-muted-foreground capitalize">
            {monster.size} {monster.type}
            {monster.alignment && `, ${monster.alignment}`}
          </p>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-4">
            {/* Basic Stats */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Armor Class</span>
                <span className="font-semibold">{monster.ac}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Hit Points</span>
                <span className="font-semibold">
                  {monster.hp_current || monster.hp_avg} / {monster.hp_max || monster.hp_avg}
                  {monster.hp_formula && <span className="text-xs ml-2 text-muted-foreground">({monster.hp_formula})</span>}
                </span>
              </div>
              {monster.speed && (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Speed</span>
                  <span className="font-semibold capitalize">
                    {typeof monster.speed === 'object' 
                      ? Object.entries(monster.speed).map(([type, value]) => 
                          `${type} ${value}ft`
                        ).join(', ')
                      : monster.speed
                    }
                  </span>
                </div>
              )}
              {monster.cr !== null && monster.cr !== undefined && (
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Challenge Rating</span>
                  <Badge variant="outline">CR {monster.cr}</Badge>
                </div>
              )}
            </div>

            <Separator />

            {/* Ability Scores */}
            {renderAbilityScores()}

            <Separator />

            {/* Saves, Skills, Senses */}
            <div className="space-y-2 text-sm">
              {monster.saves && Object.keys(monster.saves).length > 0 && (
                <div>
                  <span className="font-semibold">Saving Throws: </span>
                  <span className="text-muted-foreground">
                    {Object.entries(monster.saves).map(([ability, bonus]: [string, any]) => 
                      `${ability.toUpperCase()} ${bonus >= 0 ? '+' : ''}${bonus}`
                    ).join(', ')}
                  </span>
                </div>
              )}
              {monster.skills && Object.keys(monster.skills).length > 0 && (
                <div>
                  <span className="font-semibold">Skills: </span>
                  <span className="text-muted-foreground capitalize">
                    {Object.entries(monster.skills).map(([skill, bonus]: [string, any]) => 
                      `${skill.replace('_', ' ')} ${bonus >= 0 ? '+' : ''}${bonus}`
                    ).join(', ')}
                  </span>
                </div>
              )}
              {monster.senses && Object.keys(monster.senses).length > 0 && (
                <div>
                  <span className="font-semibold">Senses: </span>
                  <span className="text-muted-foreground">
                    {typeof monster.senses === 'object'
                      ? Object.entries(monster.senses).map(([sense, value]) => 
                          `${sense} ${value}ft`
                        ).join(', ')
                      : monster.senses
                    }
                  </span>
                </div>
              )}
              {monster.languages && (
                <div>
                  <span className="font-semibold">Languages: </span>
                  <span className="text-muted-foreground">{monster.languages}</span>
                </div>
              )}
            </div>

            {/* Resistances, Immunities, Vulnerabilities */}
            {(monster.resistances?.length > 0 || monster.immunities?.length > 0 || monster.vulnerabilities?.length > 0) && (
              <>
                <Separator />
                <div className="space-y-2 text-sm">
                  {monster.resistances?.length > 0 && (
                    <div>
                      <span className="font-semibold">Damage Resistances: </span>
                      <span className="text-muted-foreground">{monster.resistances.join(', ')}</span>
                    </div>
                  )}
                  {monster.immunities?.length > 0 && (
                    <div>
                      <span className="font-semibold">Damage Immunities: </span>
                      <span className="text-muted-foreground">{monster.immunities.join(', ')}</span>
                    </div>
                  )}
                  {monster.vulnerabilities?.length > 0 && (
                    <div>
                      <span className="font-semibold">Damage Vulnerabilities: </span>
                      <span className="text-muted-foreground">{monster.vulnerabilities.join(', ')}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Traits */}
            {renderTraits() && (
              <>
                <Separator />
                {renderTraits()}
              </>
            )}

            {/* Actions */}
            {renderActions() && (
              <>
                <Separator />
                {renderActions()}
              </>
            )}

            {/* Reactions */}
            {renderReactions() && (
              <>
                <Separator />
                {renderReactions()}
              </>
            )}

            {/* Legendary Actions */}
            {renderLegendaryActions() && (
              <>
                <Separator />
                {renderLegendaryActions()}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MonsterDetailDialog;
