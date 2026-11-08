/**
 * AiLayerStudio — إنشاء طبقات خلفية فخمة بالوصف فقط (بلا كود، بلا انتظار)
 * يبني الطبقة محلياً وفوراً عبر luxeLayerFactory.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Sparkles, RefreshCw, Wand2 } from "lucide-react";
import { buildLuxeLayer, PALETTES, EFFECTS, pickEffect } from "@/lib/luxeLayerFactory";

const IDEAS = [
  "غبار ذهبي يتصاعد ببطء مع وهج دافئ",
  "نجوم تتلألأ وشفق ناعم",
  "أوراق ذهبية تتساقط بهدوء",
  "موجات حرير تتحرك ببطء",
  "أشعة نور خفيفة من الأعلى",
  "هالات نور متوهجة تتوسع",
];

const LUXE = [
  { id: "soft", label: "هادئ" },
  { id: "rich", label: "فخم" },
  { id: "ultra", label: "فخم جداً" },
];

export default function AiLayerStudio({ layerForm, setLayerForm }) {
  const [seed, setSeed] = useState(() => Date.now());
  const luxe = layerForm.aiLuxe || "rich";
  const palette = layerForm.aiPalette || "emerald_gold";
  const motion = layerForm.aiMotion ?? 5;
  const desc = layerForm.aiPrompt || "";
  const effect = layerForm.aiEffect || "";

  const generate = (variation = false) => {
    if (!desc.trim() && !effect) { toast.error("اكتب وصف التأثير أو اختر نوعاً"); return; }
    const s = variation ? Date.now() : seed;
    if (variation) setSeed(s);
    const out = buildLuxeLayer({ desc, palette, luxe, motion, effect: effect || undefined, seed: s });
    setLayerForm(f => ({ ...f, html: out.html, label: f.label || out.name }));
    toast.success(variation ? "تنويع جديد جاهز ✓" : "تم إنشاء الطبقة ✓ شاهد المعاينة");
  };

  const autoEffect = EFFECTS[pickEffect(desc)]?.label;

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-primary" /> صف التأثير الذي تريده بكلماتك
        </Label>
        <textarea value={desc}
          onChange={e => setLayerForm({ ...layerForm, aiPrompt: e.target.value })}
          className="mt-1.5 w-full h-20 p-2.5 text-xs bg-card rounded-xl border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="مثال: غبار ذهبي يتصاعد ببطء مع وهج دافئ" />
        {desc.trim() && !effect && (
          <p className="mt-1 text-[10px] text-muted-foreground">سيُستخدم نمط: {autoEffect}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {IDEAS.map(i => (
          <button key={i} onClick={() => setLayerForm({ ...layerForm, aiPrompt: i, aiEffect: "" })}
            className="px-2 py-1 rounded-full border border-border bg-card text-[10px] hover:border-primary/50 hover:text-primary transition-colors">
            {i}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px]">نوع الحركة</Label>
          <select value={effect} onChange={e => setLayerForm({ ...layerForm, aiEffect: e.target.value })}
            className="w-full h-9 rounded-lg bg-card border border-border text-xs px-2">
            <option value="">حسب الوصف</option>
            {Object.entries(EFFECTS).map(([id, e]) => <option key={id} value={id}>{e.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">لوحة الألوان</Label>
          <select value={palette} onChange={e => setLayerForm({ ...layerForm, aiPalette: e.target.value })}
            className="w-full h-9 rounded-lg bg-card border border-border text-xs px-2">
            {Object.entries(PALETTES).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[11px]">مستوى الفخامة</Label>
        <div className="flex gap-1 bg-card p-1 rounded-xl border border-border">
          {LUXE.map(l => (
            <button key={l.id} onClick={() => setLayerForm({ ...layerForm, aiLuxe: l.id })}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                luxe === l.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}>{l.label}</button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[11px]">سرعة الحركة: {motion}/10</Label>
        <Slider min={1} max={10} value={[motion]}
          onValueChange={([v]) => setLayerForm({ ...layerForm, aiMotion: v })} />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => generate(false)} className="flex-1 h-9 text-xs gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> أنشئ التأثير
        </Button>
        {layerForm.html && (
          <Button size="sm" variant="outline" onClick={() => generate(true)} className="h-9 text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> تنويع آخر
          </Button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        الإنشاء فوري — اضغط «تنويع آخر» لتوليد توزيع جديد بنفس الإعدادات حتى تعجبك النتيجة.
      </p>
    </div>
  );
}