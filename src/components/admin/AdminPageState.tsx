import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminPageStateProps {
  loading?: boolean;
  message: string;
  onRetry?: () => void;
  title?: string;
}

const AdminPageState = ({ loading = false, message, onRetry, title }: AdminPageStateProps) => {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-border/50 bg-card/60 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        {loading ? (
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        ) : (
          <AlertCircle className="h-7 w-7 text-destructive" />
        )}
      </div>

      <div className="space-y-1">
        {title ? <h2 className="text-base font-semibold text-foreground">{title}</h2> : null}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      {!loading && onRetry ? <Button onClick={onRetry}>আবার চেষ্টা করুন</Button> : null}
    </div>
  );
};

export default AdminPageState;