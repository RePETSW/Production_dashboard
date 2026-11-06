const fs = require("fs");
const filesToClean = [
  "src/components/BladeChangesList.tsx",
  "src/components/BladeMaintenanceAnalytics.tsx",
  "src/components/Charts.tsx",
  "src/components/CleanlinessAudit.tsx",
  "src/components/ExecutiveAnalyticsHeader.tsx",
  "src/components/Filters.tsx",
  "src/components/FloatingFilterBar.tsx",
  "src/components/LeftDock.tsx",
  "src/components/RewashAnalyticsChart.tsx",
  "src/components/RewashBags.tsx"
];

for (const filePath of filesToClean) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, "utf8");
  
  content = content.replace(/\{[^}]*?&&\s*\(\s*<motion\.div\b[^>]*>[\s\S]*?<\/motion.div>\s*\)\s*\}/g, "");
  content = content.replace(/\{[^}]*?&&\s*\(\s*<motion\.div\b[^/]*\/\s*>\s*\)\s*\}/g, "");
  content = content.replace(/<motion\.div\b[^>]*layoutId=[^>]*>[\s\S]*?<\/motion.div>/g, "");

  fs.writeFileSync(filePath, content, "utf8");
  console.log("Cleaned:", filePath);
}
console.log("Done!");
