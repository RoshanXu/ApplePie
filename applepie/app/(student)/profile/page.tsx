import { PageHeader } from "@/components/layout/PageHeader";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="能力画像" />
      <div className="p-4 space-y-4">
        {/* Student info */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center text-xl">
              🧑‍🎓
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">测试同学</div>
              <div className="text-xs text-muted">初二上 · 人教版</div>
            </div>
          </div>
        </div>

        {/* Ability summary */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">知识点掌握</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">数学 · 一次函数</span>
              <span className="text-dim-learn font-medium">60%</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-dim-learn rounded-full" style={{ width: "60%" }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">物理 · 透镜成像</span>
              <span className="text-dim-learn font-medium">70%</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-dim-learn rounded-full" style={{ width: "70%" }} />
            </div>
          </div>
        </div>

        {/* Interest signals */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">兴趣倾向</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-dim-explore/10 text-dim-explore rounded-full text-xs font-medium">
              逻辑推理
            </span>
            <span className="px-3 py-1 bg-dim-explore/10 text-dim-explore rounded-full text-xs font-medium">
              太空探索
            </span>
            <span className="px-3 py-1 bg-muted/10 text-muted rounded-full text-xs">
              动手制作
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
