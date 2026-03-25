// Frontend side validation — instant feedback before API call

export const ASSET_COLUMNS = [
  { key: "name", label: "Asset Name", required: true },
  { key: "assetTag", label: "Asset Tag", required: false },
  { key: "category", label: "Category", required: false },
  { key: "subCategory", label: "Sub Category", required: false },
  { key: "brand", label: "Brand", required: false },
  { key: "model", label: "Model", required: false },
  { key: "serialNumber", label: "Serial Number", required: false },
  { key: "status", label: "Status", required: false },
  { key: "condition", label: "Condition", required: false },
  { key: "purchaseDate", label: "Purchase Date", required: false },
  { key: "purchasePrice", label: "Purchase Price", required: false },
  { key: "currentValue", label: "Current Value", required: false },
  { key: "warrantyExpiry", label: "Warranty Expiry", required: false },
  { key: "depreciationRate", label: "Depreciation %", required: false },
  { key: "vendor", label: "Vendor", required: false },
  { key: "department", label: "Department", required: false },
  { key: "location", label: "Location", required: false },
];

export const EMPLOYEE_COLUMNS = [
  { key: "firstName", label: "First Name", required: true },
  { key: "lastName", label: "Last Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "employeeCode", label: "Employee Code", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "designation", label: "Designation", required: false },
  { key: "employmentType", label: "Employment Type", required: false },
  { key: "department", label: "Department", required: false },
  { key: "location", label: "Location", required: false },
  { key: "joiningDate", label: "Joining Date", required: false },
];

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateAssetRow = (row, index, existingTags = new Set()) => {
  const errors = [];
  if (!row.name?.trim()) errors.push("name is required");
  if (row.purchaseDate?.trim() && !dateRegex.test(row.purchaseDate.trim()))
    errors.push("purchaseDate must be YYYY-MM-DD");
  if (row.warrantyExpiry?.trim() && !dateRegex.test(row.warrantyExpiry.trim()))
    errors.push("warrantyExpiry must be YYYY-MM-DD");
  if (
    row.purchasePrice?.toString().trim() &&
    isNaN(parseFloat(row.purchasePrice))
  )
    errors.push("purchasePrice must be a number");
  if (
    row.currentValue?.toString().trim() &&
    isNaN(parseFloat(row.currentValue))
  )
    errors.push("currentValue must be a number");
  const validStatuses = [
    "Active",
    "Inactive",
    "In Maintenance",
    "Disposed",
    "Lost",
    "Reserved",
  ];
  if (row.status?.trim() && !validStatuses.includes(row.status.trim()))
    errors.push(`Invalid status. Use: ${validStatuses.join(", ")}`);
  const validConditions = ["Excellent", "Good", "Fair", "Poor", "Damaged"];
  if (row.condition?.trim() && !validConditions.includes(row.condition.trim()))
    errors.push(`Invalid condition. Use: ${validConditions.join(", ")}`);
  return errors;
};

export const validateEmployeeRow = (row, index, existingEmails = new Set()) => {
  const errors = [];
  if (!row.firstName?.trim()) errors.push("firstName is required");
  if (!row.lastName?.trim()) errors.push("lastName is required");
  if (!row.email?.trim()) errors.push("email is required");
  else if (!emailRegex.test(row.email.trim()))
    errors.push("Invalid email format");
  if (row.joiningDate?.trim() && !dateRegex.test(row.joiningDate.trim()))
    errors.push("joiningDate must be YYYY-MM-DD");
  const validTypes = ["Full-time", "Part-time", "Contract", "Intern"];
  if (
    row.employmentType?.trim() &&
    !validTypes.includes(row.employmentType.trim())
  )
    errors.push(`Invalid employmentType. Use: ${validTypes.join(", ")}`);
  return errors;
};

// CSV template download
export const downloadTemplate = (type) => {
  const columns = type === "asset" ? ASSET_COLUMNS : EMPLOYEE_COLUMNS;
  const headers = columns.map((c) => c.key).join(",");

  const sampleRow =
    type === "asset"
      ? "Laptop Dell,AST-001,Hardware,Laptop,Dell,XPS 15,SN-001,Active,Good,2024-01-15,85000,80000,2027-01-15,20,Dell Store,IT,Main Office,"
      : "John,Doe,john.doe@company.com,EMP-001,9876543210,Software Engineer,Full-time,IT,Main Office,2024-01-15";

  const csv = `${headers}\n${sampleRow}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}_import_template.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
