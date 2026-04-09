import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const OrderSuccess = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!orderNumber) return;
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      toast({ title: "কপি হয়েছে!", description: `অর্ডার নম্বর ${orderNumber} কপি করা হয়েছে।` });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "কপি করা যায়নি", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
      <CheckCircle className="mb-6 h-20 w-20 text-primary" />
      <h1 className="mb-2 text-3xl font-bold text-foreground">অর্ডার সফল হয়েছে! 🎉</h1>
      <p className="mb-2 text-muted-foreground">আপনার অর্ডার Sapahar Mango পেয়েছে।</p>
      <div className="mb-6 flex items-center gap-2">
        <p className="text-lg font-semibold text-primary">অর্ডার নম্বর: {orderNumber}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-primary/10"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </div>
      <div className="mb-8 max-w-md rounded-lg bg-muted p-6 text-sm text-left space-y-2">
        <p>📞 আমরা শীঘ্রই আপনার সাথে ফোনে যোগাযোগ করব।</p>
        <p>🚚 অর্ডার কনফার্ম হলে ২-৫ কর্মদিবসের মধ্যে ডেলিভারি পাবেন।</p>
        <p>💰 পণ্য হাতে পেয়ে টাকা পরিশোধ করবেন।</p>
      </div>
      <div className="flex gap-4">
        <Button asChild><Link to="/products">আরও আম দেখুন</Link></Button>
        <Button asChild variant="outline"><Link to="/">হোম পেজে যান</Link></Button>
      </div>
    </div>
  );
};

export default OrderSuccess;
