import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle, Send, Phone, MapPin, Instagram } from "lucide-react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { getSetting } from "@/lib/settingsStore";

export default function Contact() {
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const contactEmail = getSetting("contact_email") || "mstqymm4@gmail.com";
  const whatsappUrl = getSetting("whatsapp_url") || "";
  const contactPhone = getSetting("contact_phone") || "";
  const contactAddress = getSetting("contact_address") || "";
  const contactIntro = getSetting("contact_intro") || t.contactIntro;
  const telegramUrl = getSetting("contact_telegram_url") || "";
  const instagramUrl = getSetting("contact_instagram_url") || "";
  const showForm = getSetting("contact_show_form") !== "false";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error(t.contactFillAll);
      return;
    }
    setSending(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      await base44.functions.invoke("sendContactMessage", { name, email, message });
      toast.success(t.contactSent);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      toast.error(t.contactSendError);
    } finally {
      setSending(false);
    }
  };

  const channels = [
    { show: !!contactEmail, href: `mailto:${contactEmail}`, icon: Mail, color: "text-primary", bg: "bg-primary/10", label: t.contactEmailLabel, value: contactEmail },
    { show: !!whatsappUrl, href: whatsappUrl, icon: WhatsAppIcon, color: "text-green-600", bg: "bg-green-500/10", label: t.whatsappLabel, value: t.directContact, ext: true },
    { show: !!telegramUrl, href: telegramUrl, icon: Send, color: "text-sky-600", bg: "bg-sky-500/10", label: t.contactTelegram, value: t.contactDirectMsg, ext: true },
    { show: !!instagramUrl, href: instagramUrl, icon: Instagram, color: "text-pink-600", bg: "bg-pink-500/10", label: t.contactInstagram, value: t.contactFollowUs, ext: true },
    { show: !!contactPhone, href: `tel:${contactPhone}`, icon: Phone, color: "text-primary", bg: "bg-primary/10", label: t.contactPhone, value: contactPhone },
    { show: !!contactAddress, href: null, icon: MapPin, color: "text-primary", bg: "bg-primary/10", label: t.contactAddress, value: contactAddress }
  ].filter((c) => c.show);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t.contactTitle}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{contactIntro}</p>
          </div>
        </div>

        {/* Contact channels */}
        {channels.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {channels.map((c, i) => {
              const Inner = (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors h-full">
                  <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                    <c.icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{c.value}</p>
                  </div>
                </div>
              );

              return c.href ? (
                <a key={i} href={c.href} target={c.ext ? "_blank" : undefined} rel={c.ext ? "noopener noreferrer" : undefined}>{Inner}</a>
              ) : (
                <div key={i}>{Inner}</div>
              );
            })}
          </div>
        )}

        {/* Contact form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{t.contactName}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.contactNamePlaceholder} className="w-full" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{t.contactEmailLabel}</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="w-full" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t.contactMessage}</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.contactMessagePlaceholder} rows={5} className="w-full resize-none" />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" disabled={sending} className="w-full sm:w-auto rounded-[4px_20px_4px_20px]">
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {t.sending}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> {t.sendMessage}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}