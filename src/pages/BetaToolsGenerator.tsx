import { useParams, useNavigate } from "react-router-dom";
import { BetaToolsLayout } from "@/components/beta-tools/BetaToolsLayout";
import { BetaGeneratorForm } from "@/components/beta-tools/BetaGeneratorForm";
import { getToolById } from "@/components/beta-tools/toolRegistry";
import { Badge } from "@/components/ui/badge";

const BetaToolsGenerator = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const tool = toolId ? getToolById(toolId) : undefined;

  if (!tool || tool.status !== 'active') {
    return (
      <BetaToolsLayout title="Tool Not Found" showBackButton>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground">Tool not found or not yet available.</p>
            <p className="text-sm text-muted-foreground">This tool may be coming soon.</p>
          </div>
        </div>
      </BetaToolsLayout>
    );
  }

  return (
    <BetaToolsLayout title={tool.name} showBackButton>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Tool header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <tool.icon className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{tool.name}</h1>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500/30 text-amber-400">{tool.categoryLabel}</Badge>
        </div>

        {/* Generator form */}
        <BetaGeneratorForm
          tool={tool}
          onSaved={() => navigate('/beta-tools/library')}
        />
      </div>
    </BetaToolsLayout>
  );
};

export default BetaToolsGenerator;
