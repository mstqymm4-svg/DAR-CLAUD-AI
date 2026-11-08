import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, UserPlus, Mail, Shield, User, RefreshCw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function DevUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState("user");
  const [inviting, setInviting]       = useState(false);
  const [search, setSearch]           = useState("");

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const all = await base44.entities.User.list('-created_date', 100);
    setUsers(all);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) { toast.error("أدخل البريد الإلكتروني"); return; }
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, inviteRole);
    toast.success(`تم إرسال دعوة إلى ${inviteEmail} ✓`);
    setInviteEmail("");
    setInviting(false);
    loadUsers();
  };

  const changeRole = async (u) => {
    const nextRole = u.role === "admin" ? "user" : "admin";
    if (!confirm(`تغيير دور ${u.email} إلى ${nextRole === "admin" ? "مدير" : "مستخدم"}؟`)) return;
    try {
      await base44.entities.User.update(u.id, { role: nextRole });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: nextRole } : x));
      toast.success("تم تحديث الدور ✓");
    } catch (e) {
      toast.error("فشل تحديث الدور");
    }
  };

  const removeUser = async (u) => {
    if (!confirm(`إزالة ${u.email} من التطبيق؟`)) return;
    try {
      await base44.entities.User.delete(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast.success("تمت الإزالة");
    } catch (e) {
      toast.error("فشل الحذف");
    }
  };

  const filtered = users.filter(u =>
    !search || u.email?.includes(search) || u.full_name?.includes(search)
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-primary">{users.length}</p>
          <p className="text-xs text-muted-foreground mt-1">إجمالي المستخدمين</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{users.filter(u=>u.role==="admin").length}</p>
          <p className="text-xs text-muted-foreground mt-1">مديرون</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black">{users.filter(u=>u.role!=="admin").length}</p>
          <p className="text-xs text-muted-foreground mt-1">مستخدمون</p>
        </div>
      </div>

      {/* Invite */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><UserPlus className="w-4 h-4 text-primary" /> دعوة مستخدم جديد</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="example@email.com" className="pr-9" dir="ltr" />
          </div>
          <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} className="h-9 px-3 rounded-xl border border-input bg-transparent text-sm">
            <option value="user">مستخدم</option>
            <option value="admin">مدير</option>
          </select>
          <Button onClick={handleInvite} disabled={inviting} className="rounded-xl shrink-0 gap-1.5">
            {inviting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
            دعوة
          </Button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> قائمة المستخدمين</h3>
          <button onClick={loadUsers} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..." className="pr-9 rounded-xl" />
          </div>
        </div>
        {loading
          ? <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
          : <div className="divide-y divide-border max-h-[50vh] overflow-y-auto">
              {filtered.map(user => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{user.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button onClick={() => changeRole(user)} title="تغيير الدور"
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-opacity hover:opacity-80 ${user.role==="admin"?"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400":"bg-muted text-muted-foreground"}`}>
                    {user.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {user.role === "admin" ? "مدير" : "مستخدم"}
                  </button>
                  <button onClick={() => removeUser(user)} title="إزالة المستخدم"
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">لا توجد نتائج</p>}
            </div>
        }
      </div>
    </div>
  );
}