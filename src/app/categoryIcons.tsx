export function CategoryIcon({ category }: { category: string }) {
  const common = { fill: "none", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (category) {
    case "Electronics":
      return <svg viewBox="0 0 24 24" {...common}><rect x="4" y="5" width="16" height="11" rx="1" /><path d="M9 20h6M12 16v4" /></svg>;
    case "Apparel":
      return <svg viewBox="0 0 24 24" {...common}><path d="M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3-2 2h-2z" /></svg>;
    case "Toys & Seasonal":
      return <svg viewBox="0 0 24 24" {...common}><path d="M12 3 14 9l6 .5-4.6 4 1.4 6-4.8-3.4L7.2 19.5l1.4-6L4 9.5 10 9z" /></svg>;
    case "Housewares":
      return <svg viewBox="0 0 24 24" {...common}><path d="M6 8h9v6a4.5 4.5 0 0 1-9 0z" /><path d="M15 9h2.5a2.5 2.5 0 0 1 0 5H15" /><path d="M6 20h9" /></svg>;
    case "Tools":
      return <svg viewBox="0 0 24 24" {...common}><path d="M14.7 6.3a3 3 0 1 0-4.2 4.2L4 17l3 3 6.5-6.5a3 3 0 0 0 4.2-4.2l-2 2-2-2z" /></svg>;
    case "Health & Beauty":
      return <svg viewBox="0 0 24 24" {...common}><path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" /></svg>;
    case "Furniture":
      return <svg viewBox="0 0 24 24" {...common}><path d="M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5M5 11h14v5H5zM6 16v3M18 16v3" /></svg>;
    default:
      return <svg viewBox="0 0 24 24" {...common}><path d="M3 8 12 4l9 4-9 4-9-4z" /><path d="M3 8v8l9 4 9-4V8M12 12v8" /></svg>;
  }
}
