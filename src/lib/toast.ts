import { toast } from "@/components/ui/sonner"; 

export const showToast = (
  message: string,
  type: "success" | "error" = "success"
) => {
  toast(message, { 
    duration: 3000,
    action: type === "success" ? undefined : { label: "Retry", onClick: () => {} },
    style: {
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      borderRadius: "10px", 
      padding: "10px 14px"  
    },
  });
};
