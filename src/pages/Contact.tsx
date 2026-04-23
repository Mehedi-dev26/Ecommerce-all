import { Phone, Mail, MapPin, Clock, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "মেসেজ পাঠানো হয়েছে!", description: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।" });
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-2 text-center text-3xl font-bold text-foreground">যোগাযোগ করুন</h1>
      <p className="mb-10 text-center text-muted-foreground">যেকোনো অর্ডার বা প্রশ্নের জন্য Surzo Shop-এ যোগাযোগ করুন</p>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {[
            { icon: Phone, title: "ফোন", info: "+880 1779-80168" },
            { icon: Mail, title: "ইমেইল", info: "surzoshop@gmail.com" },
            { icon: MapPin, title: "ঠিকানা", info: "আশুরন্দ বাজার, সাপাহার, নওগাঁ" },
            { icon: Clock, title: "সময়সূচী", info: "সকাল ৯টা - রাত ১০টা (প্রতিদিন)" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 rounded-lg bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.info}</p>
              </div>
            </div>
          ))}
          <a href="#" className="flex items-center gap-3 rounded-lg bg-primary p-4 text-primary-foreground hover:bg-primary/90">
            <Facebook className="h-5 w-5" />
            <span className="font-medium">আমাদের Facebook পেজ ভিজিট করুন</span>
          </a>
        </div>
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">মেসেজ পাঠান</h2>
          <div className="space-y-4">
            <div><Label htmlFor="cname">নাম</Label><Input id="cname" required /></div>
            <div><Label htmlFor="cphone">মোবাইল নম্বর</Label><Input id="cphone" required /></div>
            <div><Label htmlFor="cmessage">মেসেজ</Label><Textarea id="cmessage" rows={4} required /></div>
            <Button type="submit" className="w-full">মেসেজ পাঠান</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Contact;
