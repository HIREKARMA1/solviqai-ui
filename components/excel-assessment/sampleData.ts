/**
 * Sample Data for Excel Assessment
 * Provides sample spreadsheets for different assessment types
 */

// Sample P&L Statement data
export const profitAndLossSample = {
  grid: [
    ['Revenue', 'Amount (₹)'],
    ['Sales', 1000000],
    ['Other Income', 50000],
    ['', ''],
    ['Total Revenue', '=SUM(B2:B3)'],
    ['', ''],
    ['Expenses', 'Amount (₹)'],
    ['Cost of Goods Sold', 400000],
    ['Operating Expenses', 150000],
    ['', ''],
    ['Total Expenses', '=SUM(B8:B9)'],
    ['', ''],
    ['Gross Profit', '=B5-B11'],
    ['Gross Margin %', '=B13/B5*100'],
    ['', ''],
    ['Taxes (30%)', '=B13*0.30'],
    ['Net Profit', '=B13-B16'],
  ],
  description: 'P&L Statement Template'
}

// Sample Balance Sheet data
export const balanceSheetSample = {
  grid: [
    ['BALANCE SHEET', '', ''],
    ['Assets', 'Amount (₹)', ''],
    ['Current Assets', '', ''],
    ['Cash', 100000, ''],
    ['Accounts Receivable', 150000, ''],
    ['Inventory', 200000, ''],
    ['Total Current Assets', '=SUM(B4:B6)', ''],
    ['', '', ''],
    ['Fixed Assets', '', ''],
    ['Property', 500000, ''],
    ['Equipment', 300000, ''],
    ['Total Fixed Assets', '=SUM(B10:B11)', ''],
    ['', '', ''],
    ['Total Assets', '=B7+B12', ''],
    ['', '', ''],
    ['Liabilities & Equity', 'Amount (₹)', ''],
    ['Current Liabilities', '', ''],
    ['Accounts Payable', 75000, ''],
    ['Short-term Loans', 100000, ''],
    ['Total Current Liabilities', '=SUM(B18:B19)', ''],
    ['', '', ''],
    ['Long-term Liabilities', '', ''],
    ['Long-term Loans', 200000, ''],
    ['Total Long-term Liabilities', '=B23', ''],
    ['', '', ''],
    ['Equity', '', ''],
    ['Share Capital', 400000, ''],
    ['Retained Earnings', '=B14-B20-B24-B27', ''],
    ['Total Equity', '=SUM(B27:B28)', ''],
    ['', '', ''],
    ['Total Liabilities & Equity', '=B20+B24+B29', ''],
  ],
  description: 'Balance Sheet Template'
}

// Sample Cash Flow data
export const cashFlowSample = {
  grid: [
    ['CASH FLOW STATEMENT', 'Year 1 (₹)'],
    ['', ''],
    ['Operating Activities', ''],
    ['Net Income', 300000],
    ['Add: Depreciation', 50000],
    ['Less: Increase in Receivables', -50000],
    ['Cash from Operations', '=SUM(B4:B6)'],
    ['', ''],
    ['Investing Activities', ''],
    ['Equipment Purchase', -100000],
    ['Land Purchase', -150000],
    ['Cash from Investing', '=SUM(B10:B11)'],
    ['', ''],
    ['Financing Activities', ''],
    ['Loan Proceeds', 200000],
    ['Dividend Paid', -50000],
    ['Cash from Financing', '=SUM(B15:B16)'],
    ['', ''],
    ['Net Change in Cash', '=B7+B12+B17'],
    ['Opening Balance', 100000],
    ['Closing Balance', '=B19+B20'],
  ],
  description: 'Cash Flow Statement Template'
}

// Sample Accounting Journal Entry
export const journalEntrySample = {
  grid: [
    ['Date', 'Account', 'Description', 'Debit (₹)', 'Credit (₹)'],
    ['01-01-2024', 'Bank', 'Initial Capital Contribution', 500000, ''],
    ['01-01-2024', 'Capital', 'Initial Capital Contribution', '', 500000],
    ['', '', '', '', ''],
    ['05-01-2024', 'Machinery', 'Purchase of Equipment', 100000, ''],
    ['05-01-2024', 'Bank', 'Payment for Equipment', '', 100000],
    ['', '', '', '', ''],
    ['Total', '', '', '=SUM(D2:D6)', '=SUM(E2:E6)'],
    ['Balance Check', '', '', '=IF(D8=E8,"Balanced","Unbalanced")', ''],
  ],
  description: 'Journal Entry Template'
}

// Sample Inventory Valuation
export const inventoryValuationSample = {
  grid: [
    ['INVENTORY VALUATION - FIFO METHOD', '', '', ''],
    ['Date', 'Quantity', 'Unit Price (₹)', 'Total Value (₹)'],
    ['Opening Stock', 100, 50, '=B3*C3'],
    ['Purchase - 15-Jan', 150, 55, '=B4*C4'],
    ['Purchase - 20-Jan', 200, 60, '=B5*C5'],
    ['', '', '', ''],
    ['Total Available', '=SUM(B3:B5)', 'Weighted Avg', '=D6/B6'],
    ['', '', '', ''],
    ['Sales - 25-Jan', 180, '', ''],
    ['COGS (FIFO)', '=B9', '=C3', '=B9*D9'],
    ['Closing Stock', '=B6-B9', '', '=B10*D7'],
  ],
  description: 'Inventory Valuation (FIFO) Template'
}

// Sample Ratio Analysis
export const ratioAnalysisSample = {
  grid: [
    ['FINANCIAL RATIO ANALYSIS', 'Year 1 (₹)', 'Year 2 (₹)', 'Year 1 Ratio', 'Year 2 Ratio'],
    ['', '', '', '', ''],
    ['Balance Sheet Items', '', '', '', ''],
    ['Current Assets', 500000, 600000, '', ''],
    ['Current Liabilities', 200000, 250000, '', ''],
    ['Total Assets', 1000000, 1200000, '', ''],
    ['Total Equity', 700000, 800000, '', ''],
    ['', '', '', '', ''],
    ['Income Statement Items', '', '', '', ''],
    ['Revenue', 1000000, 1200000, '', ''],
    ['Net Income', 300000, 360000, '', ''],
    ['', '', '', '', ''],
    ['Ratios', '', '', '', ''],
    ['Current Ratio', '', '', '=B4/B5', '=C4/C5'],
    ['Debt-to-Equity', '', '', '=B5/B7', '=C5/C7'],
    ['ROE', '', '', '=B11/B7*100', '=C11/C7*100'],
    ['Profit Margin', '', '', '=B11/B10*100', '=C11/C10*100'],
  ],
  description: 'Financial Ratio Analysis Template'
}

// Export all samples
export const SAMPLE_DATA_MAP = {
  'profit-loss': profitAndLossSample,
  'balance-sheet': balanceSheetSample,
  'cash-flow': cashFlowSample,
  'journal-entry': journalEntrySample,
  'inventory-valuation': inventoryValuationSample,
  'ratio-analysis': ratioAnalysisSample,
}

export default SAMPLE_DATA_MAP
