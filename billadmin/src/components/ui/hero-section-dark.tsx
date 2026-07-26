import * as React from "react"
import { cn } from "@/lib/utils"
import { ShieldCheck, Zap, FileText, Smartphone, TrendingUp, Users, CheckCircle2 } from "lucide-react"

interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

const RetroGrid = () => {
  return (
    <div className="pointer-events-none absolute size-full overflow-hidden opacity-30 [perspective:200px]">
      <div className="absolute inset-0 [transform:rotateX(60deg)]">
        <div className="animate-grid [background-image:linear-gradient(to_right,rgba(99,102,241,0.15)_1px,transparent_0),linear-gradient(to_bottom,rgba(99,102,241,0.15)_1px,transparent_0)] [background-repeat:repeat] [background-size:50px_50px] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
    </div>
  )
}

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  ({ className, title, subtitle, ...props }, ref) => {
    return (
      <div className={cn("relative min-h-screen w-full flex flex-col justify-center overflow-hidden p-8 lg:p-12", className)} ref={ref} {...props}>
        <RetroGrid />
        
        <div className="relative z-10 max-w-xl mx-auto space-y-8">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-sm">
            <Zap size={14} className="animate-pulse text-teal-400" />
            <span>SATYA BILLFLOW ENTERPRISE SAAS</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Local-First GST Billing & Cloud Telemetry Platform
            </h1>
            <p className="text-on-surface-variant text-sm lg:text-base leading-relaxed">
              Centralized operations panel for Indian SMB merchant subscriptions, multi-role staff access control (RBAC), automated GST compliance, and customer support.
            </p>
          </div>

          {/* Value Proposition Badges */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-container-low/80 border border-outline-variant/15 flex items-center gap-2.5 backdrop-blur-md">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <FileText size={16} />
              </div>
              <div>
                <p className="font-bold text-white">GST Compliance</p>
                <p className="text-[11px] text-on-surface-variant">E-Invoicing & GSTR-1</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low/80 border border-outline-variant/15 flex items-center gap-2.5 backdrop-blur-md">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="font-bold text-white">Multi-Role RBAC</p>
                <p className="text-[11px] text-on-surface-variant">Super Admin & Workers</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low/80 border border-outline-variant/15 flex items-center gap-2.5 backdrop-blur-md">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Zap size={16} />
              </div>
              <div>
                <p className="font-bold text-white">Local-First Speed</p>
                <p className="text-[11px] text-on-surface-variant">Offline POS + Cloud Sync</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low/80 border border-outline-variant/15 flex items-center gap-2.5 backdrop-blur-md">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Smartphone size={16} />
              </div>
              <div>
                <p className="font-bold text-white">WhatsApp & UPI</p>
                <p className="text-[11px] text-on-surface-variant">Instant Invoice Links</p>
              </div>
            </div>
          </div>

          {/* Interactive Live Telemetry Preview Card */}
          <div className="p-5 rounded-2xl bg-surface-container-low/90 border border-outline-variant/20 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Live System Metrics</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% REAL-TIME SYNC
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-surface-container/60">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">ARR Run-Rate</p>
                <p className="text-lg font-extrabold text-teal-400 mt-0.5">₹18.4L</p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container/60">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Active SMBs</p>
                <p className="text-lg font-extrabold text-purple-400 mt-0.5">1,420</p>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container/60">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">GST Compliant</p>
                <p className="text-lg font-extrabold text-blue-400 mt-0.5">100%</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-400" /> Supabase Realtime Telemetry
              </span>
              <span className="font-mono">BillFlow v2.4 Enterprise</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

HeroSection.displayName = "HeroSection"

export { HeroSection }