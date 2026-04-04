import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const OrderSuccess = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <div className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
      <CheckCircle className="mb-6 h-20 w-20 text-primary" />
      <h1 className="mb-2 text-3xl font-bold text-foreground">অর্ডার সফল হয়েছে! 🎉</h1>
      <p className="mb-2 text-muted-foreground">আপনার অর্ডার আমরা পেয়েছি।</p>
      <p className="mb-6 text-lg font-semibold text-primary">অর্ডার নম্বর: {orderNumber}</p>
      <div className="mb-8 max-w-md rounded-lg bg-muted p-6 text-sm text-left space-y-2">
        <p>📞 আমরা শীঘ্রই আপনার সাথে ফোনে যোগাযোগ করব।</p>
        <p>🚚 অর্ডার কনফার্ম হলে ২-৫ কর্মদিবসের মধ্যে ডেলিভারি পাবেন।</p>
        <p>💰 পণ্য হাতে পেয়ে টাকা পরিশোধ করবেন।</p>
      </div>
      <div className="flex gap-4">
        <Button asChild><Link to="/products">আরও পণ্য দেখুন</Link></Button>
        <Button asChild variant="outline"><Link to="/">হোম পেজে যান</Link></Button>
      </div>
    </div>
  );
};

export default OrderSuccess;
