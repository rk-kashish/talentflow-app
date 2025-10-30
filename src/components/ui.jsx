import React, { useEffect } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// --- Shadcn/UI `cn` Utility (assuming it's not in lib/utils) ---
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Button
export const Button = React.forwardRef(({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
  const Comp = asChild ? 'span' : 'button';
  const variants = { default: "bg-[#3B82F6] text-[#F9FAFB] hover:bg-[#2563EB] border-none", destructive: "bg-[#EF4444] text-[#F9FAFB] hover:bg-[#B91C1C] border-none", secondary: "bg-[#374151] text-[#F9FAFB] border-none", outline: "bg-transparent border border-[#374151] text-[#F9FAFB] hover:bg-[#374151]", ghost: "bg-transparent text-[#F9FAFB] hover:bg-[#374151] border-none", link: "bg-transparent text-[#3B82F6] underline-offset-4 hover:underline border-none" };
  const sizes = { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8", icon: "h-10 w-10" };
  return <Comp className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none", variants[variant], sizes[size], className)} ref={ref} {...props} />
});
Button.displayName = 'Button';

// Card
export const Card = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("rounded-lg border bg-[#1F2937] text-[#F9FAFB] border-[#374151] shadow-sm transition-colors duration-300", className)} {...props} />);
Card.displayName = 'Card';
export const CardHeader = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6 bg-transparent", className)} {...props} />);
CardHeader.displayName = 'CardHeader';
export const CardTitle = React.forwardRef(({ className, ...props }, ref) => <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight text-black", className)} {...props} />);
CardTitle.displayName = 'CardTitle';
export const CardDescription = React.forwardRef(({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-[#9CA3AF]", className)} {...props} />);
CardDescription.displayName = 'CardDescription';
export const CardContent = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />);
CardContent.displayName = 'CardContent';
export const CardFooter = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />);
CardFooter.displayName = 'CardFooter';

// Input
export const Input = React.forwardRef(({ className, type, ...props }, ref) => <input type={type} className={cn("flex h-10 w-full rounded-md border border-[#374151] bg-transparent px-3 py-2 text-sm placeholder:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-300", className)} ref={ref} {...props} />);
Input.displayName = 'Input';

// Textarea
export const Textarea = React.forwardRef(({ className, ...props }, ref) => <textarea className={cn("flex min-h-[80px] w-full rounded-md border border-[#374151] bg-transparent px-3 py-2 text-sm placeholder:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-300", className)} ref={ref} {...props} />);
Textarea.displayName = 'Textarea';

// Label
export const Label = React.forwardRef(({ className, ...props }, ref) => <label ref={ref} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />);
Label.displayName = 'Label';

// Select
export const Select = React.forwardRef(({ className, children, ...props }, ref) => <select className={cn("flex h-10 w-full items-center justify-between rounded-md border border-[#374151] bg-transparent px-3 py-2 text-sm placeholder:text-black focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props}>{children}</select>);
Select.displayName = 'Select';

// Dialog
const DialogContext = React.createContext();
export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (<DialogContext.Provider value={{ onOpenChange }}><div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} /><div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#374151] bg-[#1F2937] p-6 shadow-lg">{children}</div></DialogContext.Provider>);
};
export const DialogTitle = ({ className, ...props }) => <h2 className={cn("text-lg font-semibold text-black", className)} {...props} />;
export const DialogDescription = ({ className, ...props }) => <p className={cn("text-sm text-[#9CA3AF]", className)} {...props} />;
export const DialogFooter = ({ className, ...props }) => <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)} {...props} />;

// Badge
export const Badge = ({ className, variant = 'default', ...props }) => {
  const variants = { default: "bg-[#374151] text-[#F9FAFB]", active: "bg-[#22C55E] text-[#111827] font-semibold", archived: "bg-[#EAB308] text-[#111827] font-semibold" };
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors duration-300 border-none", variants[variant] || variants.default, className)} {...props} />
};

// Toast
export function Toast({ message, type = 'error', onDismiss }) {
  const colors = { error: 'bg-red-600', success: 'bg-green-600' };
  useEffect(() => { const timer = setTimeout(onDismiss, 3000); return () => clearTimeout(timer); }, [onDismiss]);
  return <div className={cn("fixed bottom-4 right-4 z-50 max-w-sm rounded-lg shadow-lg text-white px-4 py-3", colors[type])}>{message}</div>
}

// Checkbox
export const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <input type="checkbox" ref={ref} className={cn("h-4 w-4 rounded border-[#374151] text-[#3B82F6] focus:ring-[#3B82F6]", className)} {...props} />
));
Checkbox.displayName = 'Checkbox';

// RadioGroup
export const RadioGroup = ({ children, value, onValueChange, name, className }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        const childValue = child.props.value;
        return React.cloneElement(child, {
          name,
          checked: value === childValue,
          onChange: () => onValueChange && onValueChange(childValue),
        });
      })}
    </div>
  );
};
export const RadioGroupItem = React.forwardRef(({ className, value, id, ...props }, ref) => {
  const inputId = id || `radio-${String(value).replace(/\s+/g,'-')}`;
  return (
    <div className="flex items-center space-x-2">
      <input type="radio" id={inputId} ref={ref} value={value} className={cn("h-4 w-4 border-[#374151] text-[#3B82F6] focus:ring-[#3B82F6]", className)} {...props} />
      <Label htmlFor={inputId}>{value}</Label>
    </div>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';

// Switch
export const Switch = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => (
  <button
    type="button" role="switch" aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn("relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2", checked ? 'bg-[#3B82F6]' : 'bg-[#374151]', className)}
    ref={ref} {...props}
  >
    <span aria-hidden="true" className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", checked ? 'translate-x-5' : 'translate-x-0')} />
  </button>
));
Switch.displayName = 'Switch';
