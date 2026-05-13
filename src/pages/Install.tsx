import { useEffect, useState } from "react";
import { Download, Share2, CheckCircle2, Smartphone, Zap, WifiOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { toast } from "sonner";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios|edgios/i.test(navigator.userAgent);

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true);

const Install = () => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIOS());
    setInstalled(isStandalone());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success("অ্যাপ সফলভাবে ইনস্টল হয়েছে!");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) {
      if (ios) {
        toast.message("iPhone-এ ইনস্টল করুন", {
          description: "Safari এর Share বাটন → 'Add to Home Screen' চাপুন।",
        });
      } else {
        toast.message("ইনস্টল প্রস্তুত হচ্ছে…", {
          description: "ব্রাউজার মেনু → 'Install app' / 'Add to Home Screen' চাপুন।",
        });
      }
      return;
    }
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      toast.success("ইনস্টল শুরু হয়েছে…");
    }
    setDeferred(null);
  };

  return (
    <>
      <SEO
        title="অ্যাপ ইনস্টল করুন — Sapahar Shop"
        description="Sapahar Shop অ্যাপ আপনার ফোনে এক ক্লিকে ইনস্টল করুন। দ্রুত, অফলাইন-ফ্রেন্ডলি এবং হোম স্ক্রিন থেকে সরাসরি অ্যাক্সেস।"
        path="/install"
      />
      <div className="bg-gradient-to-b from-amber-50 via-background to-background py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl ring-1 ring-amber-200">
              <img src="/brand-logo.png?v=4" alt="Sapahar Shop" className="h-14 w-14 object-contain" />
            </div>
            <h1 className="font-brand text-4xl text-amber-700 sm:text-5xl">Sapahar Shop</h1>
            <p className="mt-2 text-sm font-semibold tracking-wide text-amber-800/80 sm:text-base">
              অ্যাপটি আপনার ফোনে ইনস্টল করুন
            </p>
            <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
              নিচের বাটনে ক্লিক করেই Sapahar Shop অ্যাপটি আপনার হোম স্ক্রিনে যোগ হয়ে যাবে। আলাদা কোনো App Store লাগবে না।
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              {installed ? (
                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-3 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">অ্যাপটি ইতিমধ্যেই ইনস্টল করা আছে</span>
                </div>
              ) : (
                <Button
                  size="lg"
                  onClick={handleInstall}
                  className="h-14 gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-8 text-base font-bold text-white shadow-lg hover:from-amber-600 hover:to-orange-700"
                >
                  {ios ? <Share2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                  {ios ? "iPhone-এ ইনস্টল করুন" : "এখনই ইনস্টল করুন"}
                </Button>
              )}
              {!installed && deferred === null && !ios && (
                <p className="max-w-md text-xs text-muted-foreground">
                  ব্রাউজার যদি তাৎক্ষণিক prompt না দেখায়, তাহলে ব্রাউজার মেনু (⋮) থেকে
                  <strong> "Install app" </strong> অথবা <strong>"Add to Home Screen"</strong> বেছে নিন।
                </p>
              )}
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { icon: Zap, title: "দ্রুত লোডিং", desc: "ব্রাউজারের চেয়েও তাড়াতাড়ি খোলে" },
              { icon: Smartphone, title: "হোম স্ক্রিনে", desc: "সরাসরি অ্যাপের মতো অ্যাক্সেস" },
              { icon: WifiOff, title: "অফলাইন-ফ্রেন্ডলি", desc: "দুর্বল নেটেও মসৃণ অভিজ্ঞতা" },
            ].map((f) => (
              <Card key={f.title} className="p-5 text-center">
                <f.icon className="mx-auto mb-3 h-8 w-8 text-amber-600" />
                <h3 className="font-bold text-foreground">{f.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>

          {ios && !installed && (
            <Card className="mx-auto mt-8 max-w-xl p-6">
              <div className="mb-3 flex items-center gap-2 text-amber-700">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-bold">iPhone / iPad-এ ইনস্টল করার নিয়ম</h3>
              </div>
              <ol className="space-y-2 text-sm text-foreground">
                <li>১. Safari ব্রাউজারে এই পেজটি খুলুন</li>
                <li>২. নিচের <strong>Share</strong> (শেয়ার) বাটনে ট্যাপ করুন</li>
                <li>৩. "Add to Home Screen" বেছে নিন</li>
                <li>৪. উপরের ডানে <strong>Add</strong> চাপুন — হয়ে গেল!</li>
              </ol>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default Install;
