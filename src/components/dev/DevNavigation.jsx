import { useState, useEffect } from "react";
import { Navigation, GripVertical, Eye, EyeOff, Check, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSetting, setSettings, setSetting, subscribeToSettings } from "@/lib/settingsStore";

import { DEFAULT_NAV_ITEMS, NAV_ICONS, readNavItems } from "@/lib/navConfig";

export default function DevNavigation() {
  const [showDevNav, setShowDevNav] = useState(() => getSetting("show_dev_nav") !== "false");
  const [navItems, setNavItems]     = useState(() => readNavItems());
  const [dragIdx, setDragIdx]       = useState(null);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    const unsub = subscribeToSettings((s) => {
      setShowDevNav(s.show_dev_nav !== "false");
      if (s.nav_items) setNavItems(readNavItems(s.nav_items));
    });
    return unsub;
  }, []);

  const handleToggleVisible = (id) => {
    const updated = navItems.map(item => item.id === id ? { ...item, visible: !item.visible } : item);
    setNavItems(updated);
    setSettings({ nav_items: JSON.stringify(updated) });
    toast.success("تم التحديث ✓");
  };

  const handleDragStart = (idx) => setDragIdx(idx);

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...navItems];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setNavItems(updated);
    setDragIdx(idx);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setSettings({ nav_items: JSON.stringify(navItems) });
    toast.success("تم حفظ الترتيب ✓");
  };

  const handleLabelChange = (id, value) => {
    const updated = navItems.map(item => item.id === id ? { ...item, label: value } : item);
    setNavItems(updated);
  };

  // Persist the edited label as soon as the field loses focus
  const handleLabelBlur = () => setSettings({ nav_items: JSON.stringify(navItems) });

  const handleSave = () => {
    setSettings({ nav_items: JSON.stringify(navItems), show_dev_nav: String(showDevNav) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success("تم حفظ إعدادات التنقل ✓");
  };

  const handleReset = () => {
    setNavItems(DEFAULT_NAV_ITEMS);
    setSettings({ nav_items: JSON.stringify(DEFAULT_NAV_ITEMS) });
    toast.success("تم إعادة التنقل للافتراضي");
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Preview */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Navigation className="w-4 h-4 text-primary" /> معاينة شريط التنقل</h3>
        <div className="bg-background border border-border rounded-xl p-3">
          <div className="flex items-center justify-around">
            {navItems.filter(i => i.visible).map((item, i) => {
              const Icon = NAV_ICONS[item.icon];
              return (
                <div key={item.id} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl ${i===0?"text-primary":"text-muted-foreground"}`}>
                  {Icon ? <Icon className="w-5 h-5" /> : <div className="w-5 h-5 rounded bg-current opacity-50" />}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dev Nav Toggle */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <Label className="text-sm font-bold">زر المطور في شريط التنقل</Label>
          <p className="text-xs text-muted-foreground mt-0.5">إظهار رابط لوحة التحكم</p>
        </div>
        <Switch checked={showDevNav} onCheckedChange={v => { setShowDevNav(v); setSetting("show_dev_nav", String(v)); }} />
      </div>

      {/* Nav Items */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4">إدارة عناصر التنقل</h3>
        <p className="text-xs text-muted-foreground mb-3">اسحب لإعادة الترتيب · انقر على العين لإظهار/إخفاء</p>
        <div className="space-y-2">
          {navItems.map((item, idx) => (
            <div key={item.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing ${dragIdx === idx ? "border-primary bg-primary/5 opacity-70" : "border-border hover:border-primary/30 bg-muted/30"}`}>
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {(() => { const Icon = NAV_ICONS[item.icon]; return Icon ? <Icon className="w-4 h-4 text-muted-foreground" /> : <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>; })()}
              </div>
              <div className="flex-1 min-w-0">
                <input value={item.label} onChange={e => handleLabelChange(item.id, e.target.value)} onBlur={handleLabelBlur}
                  className="w-full bg-transparent text-sm font-bold outline-none border-none p-0 focus:border-b focus:border-primary" />
                <p className="text-[10px] text-muted-foreground font-mono">{item.path}</p>
              </div>
              <button onClick={() => handleToggleVisible(item.id)}
                className={`p-1.5 rounded-lg transition-colors ${item.visible ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}>
                {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} className={`flex-1 rounded-xl h-11 font-bold gap-2 transition-all ${saved?"bg-green-600 hover:bg-green-700":""}`}>
          {saved ? <><Check className="w-4 h-4" />تم الحفظ!</> : "حفظ إعدادات التنقل"}
        </Button>
        <Button variant="outline" onClick={handleReset} className="rounded-xl h-11 gap-2 font-bold hover:border-destructive/50 hover:text-destructive">
          <RotateCcw className="w-4 h-4" /> إعادة
        </Button>
      </div>
    </div>
  );
}