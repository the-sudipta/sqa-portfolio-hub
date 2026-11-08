// Builds the downloadable Excel test case template (assets/files/SQA_Test_Case_Template.xlsx).
const path = require('path');
const ExcelJS = require('exceljs');

const OUT = path.resolve(__dirname, '../assets/files/SQA_Test_Case_Template.xlsx');
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };

const COLUMNS = [
  ['Test Case ID', 13],
  ['Module', 14],
  ['Requirement', 12],
  ['Technique', 11],
  ['Scenario', 30],
  ['Pre-conditions', 26],
  ['Test Steps', 40],
  ['Test Data', 24],
  ['Expected Result', 36],
  ['Actual Result', 36],
  ['Status', 11],
  ['Severity', 11],
  ['Priority', 9],
  ['Bug ID', 10],
  ['Remarks', 28],
];

const LISTS = {
  D: ['EP', 'BVA', 'DT', 'ST', 'EG', 'UC'],
  K: ['Not Run', 'Pass', 'Fail', 'Blocked', 'Skipped'],
  L: ['Critical', 'Major', 'Minor', 'Trivial'],
  M: ['P1', 'P2', 'P3'],
};

const EXAMPLE = [
  'TC-LOGIN-001',
  'Login',
  'REQ-01',
  'EP',
  'Login with valid credentials',
  'User is registered; login page is open',
  '1. Enter username\n2. Enter password\n3. Click Login',
  'standard_user / secret_sauce',
  'Products page opens',
  '',
  'Not Run',
  'Critical',
  'P1',
  '',
  'Example row - replace with your own',
];

function addCasesSheet(workbook) {
  const sheet = workbook.addWorksheet('Test Cases', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = COLUMNS.map(([header, width]) => ({ header, width }));
  sheet.addRow(EXAMPLE).alignment = { vertical: 'top', wrapText: true };
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = HEADER_FILL;
  header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  sheet.autoFilter = 'A1:O1';
  for (const [col, values] of Object.entries(LISTS)) {
    for (let row = 2; row <= 500; row += 1) {
      sheet.getCell(`${col}${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${values.join(',')}"`],
      };
    }
  }
  return sheet;
}

function addStatusColors(sheet) {
  const rules = [
    ['Pass', 'FFC6EFCE'],
    ['Fail', 'FFFFC7CE'],
    ['Blocked', 'FFFFEB9C'],
  ];
  sheet.addConditionalFormatting({
    ref: 'K2:K500',
    rules: rules.map(([text, color]) => ({
      type: 'containsText',
      operator: 'containsText',
      text,
      style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: color } } },
    })),
  });
}

function addGuideSheet(workbook) {
  const sheet = workbook.addWorksheet('How to use');
  sheet.columns = [
    { header: 'Field', width: 18 },
    { header: 'How to fill it', width: 90 },
  ];
  [
    ['Test Case ID', 'Unique ID: TC-<MODULE>-<number>, e.g. TC-CART-004'],
    [
      'Technique',
      'EP = Equivalence Partitioning, BVA = Boundary Value Analysis, DT = Decision Table, ST = State Transition, EG = Error Guessing, UC = Use Case',
    ],
    ['Test Steps', 'One action per numbered line; start each with a verb (Enter, Click, Select)'],
    ['Expected Result', 'What must happen, observable and exact (text, page, value)'],
    ['Actual Result', 'Fill during execution; for a failure write exactly what happened'],
    ['Status', 'Not Run → Pass / Fail / Blocked (blocked = cannot run because of another defect)'],
    ['Severity', 'Impact on the user: Critical, Major, Minor, Trivial'],
    ['Priority', 'How soon to fix: P1 (before release), P2 (next release), P3 (when time allows)'],
    ['Bug ID', 'ID of the defect report raised for a failed case'],
  ].forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = HEADER_FILL;
  sheet.eachRow((row) => {
    row.alignment = { vertical: 'top', wrapText: true };
  });
}

async function main() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sudipta Kumar Das';
  const sheet = addCasesSheet(workbook);
  addStatusColors(sheet);
  addGuideSheet(workbook);
  await workbook.xlsx.writeFile(OUT);
  console.log(`template written: ${path.relative(process.cwd(), OUT)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
