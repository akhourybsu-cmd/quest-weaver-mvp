import { useParams, useNavigate, Link } from "react-router-dom";
import { BetaToolsLayout } from "@/components/beta-tools/BetaToolsLayout";
import { BetaGeneratorForm } from "@/components/beta-tools/BetaGeneratorForm";
import { MissingLoreDetector } from "@/components/beta-tools/MissingLoreDetector";
import { getToolById, getToolsByCategory } from "@/components/beta-tools/toolRegistry";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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

  const firstInCategory = getToolsByCategory(tool.category).find(t => t.status === 'active');

  return (
    <BetaToolsLayout title={tool.name} showBackButton>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/beta-tools">Beta Tools</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {firstInCategory ? (
                <BreadcrumbLink asChild>
                  <Link to={`/beta-tools/generate/${firstInCategory.id}`}>{tool.categoryLabel}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{tool.categoryLabel}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tool.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="space-y-2 pb-4 border-b-2 border-brand-brass/30">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-brand-brass/10 border border-brand-brass/20">
              <tool.icon className="h-7 w-7 text-brand-brass" />
            </div>
            <div>
              <h1 className="font-cinzel text-2xl font-bold text-foreground">{tool.name}</h1>
              <p className="text-sm text-foreground/60">{tool.description}</p>
            </div>
          </div>
        </div>

        {tool.assetType === 'lore_gap' ? (
          <MissingLoreDetector />
        ) : (
          <BetaGeneratorForm
            tool={tool}
            onSaved={() => navigate('/beta-tools/library')}
          />
        )}
      </div>
    </BetaToolsLayout>
  );
};

export default BetaToolsGenerator;
