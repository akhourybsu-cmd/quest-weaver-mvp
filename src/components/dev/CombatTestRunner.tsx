import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  runAllDamageTests,
  damageEngineTests,
} from "@/lib/__tests__/damageEngine.test";
import {
  runAllConcentrationTests,
  runAllDeathSaveTests,
  concentrationTests,
  deathSaveTests,
} from "@/lib/__tests__/combatLogic.test";
import { CheckCircle2, XCircle, Play } from "lucide-react";

export function CombatTestRunner() {
  const [damageResults, setDamageResults] = useState<any>(null);
  const [concentrationResults, setConcentrationResults] = useState<any>(null);
  const [deathSaveResults, setDeathSaveResults] = useState<any>(null);

  const runTests = () => {
    setDamageResults(runAllDamageTests());
    setConcentrationResults(runAllConcentrationTests());
    setDeathSaveResults(runAllDeathSaveTests());
  };

  const totalTests =
    damageEngineTests.length + concentrationTests.length + deathSaveTests.length;
  const totalPassed =
    (damageResults?.passed || 0) +
    (concentrationResults?.passed || 0) +
    (deathSaveResults?.passed || 0);
  const totalFailed =
    (damageResults?.failed || 0) +
    (concentrationResults?.failed || 0) +
    (deathSaveResults?.failed || 0);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Combat Logic Test Suite</span>
          <Button onClick={runTests} size="sm">
            <Play className="w-4 h-4 mr-2" />
            Run All Tests
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {damageResults && concentrationResults && deathSaveResults && (
          <div className="flex gap-4 p-4 bg-muted rounded-lg">
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold">{totalTests}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-green-600">
                {totalPassed}
              </div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-red-600">
                {totalFailed}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>
        )}

        {damageResults && (
          <TestSection
            title="Damage Engine (RVI)"
            results={damageResults}
            badge={
              <Badge variant={damageResults.failed === 0 ? "default" : "destructive"}>
                {damageResults.passed}/{damageEngineTests.length}
              </Badge>
            }
          />
        )}

        {concentrationResults && (
          <TestSection
            title="Concentration DC"
            results={concentrationResults}
            badge={
              <Badge
                variant={
                  concentrationResults.failed === 0 ? "default" : "destructive"
                }
              >
                {concentrationResults.passed}/{concentrationTests.length}
              </Badge>
            }
          />
        )}

        {deathSaveResults && (
          <TestSection
            title="Death Saves"
            results={deathSaveResults}
            badge={
              <Badge
                variant={deathSaveResults.failed === 0 ? "default" : "destructive"}
              >
                {deathSaveResults.passed}/{deathSaveTests.length}
              </Badge>
            }
          />
        )}

        {!damageResults && !concentrationResults && !deathSaveResults && (
          <div className="text-center py-8 text-muted-foreground">
            Click "Run All Tests" to validate combat logic
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TestSection({
  title,
  results,
  badge,
}: {
  title: string;
  results: any;
  badge: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {badge}
      </div>
      <ScrollArea className="h-48 rounded-md border">
        <div className="p-4 space-y-2">
          {results.results.map((result: any, idx: number) => (
            <div
              key={idx}
              className="flex items-start gap-2 text-sm"
            >
              {result.passed ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="font-medium">{result.test}</div>
                <div className="text-muted-foreground text-xs">
                  {result.details}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
