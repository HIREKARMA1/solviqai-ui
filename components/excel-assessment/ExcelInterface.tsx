"use client"

import React, { useState, useRef, useCallback } from 'react'
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import Handsontable from 'handsontable'
import { HyperFormula } from 'hyperformula'
import 'handsontable/dist/handsontable.full.min.css'
import './HandsontableStyles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, AlertCircle, Sparkles, Save, 
  RotateCcw, Download, Calculator, Table
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

// Register all Handsontable modules
registerAllModules()

interface ExcelInterfaceProps {
  questionId: string
  assessmentId: string
  instructions: string
  sampleData?: any
  onSubmit: (spreadsheetData: any) => Promise<void>
  isSubmitted?: boolean
  evaluation?: any
}

export default function ExcelInterface({
  questionId,
  assessmentId,
  instructions,
  sampleData,
  onSubmit,
  isSubmitted = false,
  evaluation
}: ExcelInterfaceProps) {
  const hotTableRef = useRef<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedCell, setSelectedCell] = useState<string>('A1')

  // Initialize data from sampleData or create empty grid
  const [data, setData] = useState(() => {
    if (sampleData?.grid) {
      return sampleData.grid
    }
    // Default 25 rows x 10 columns for accounting tasks
    return Array(25).fill(null).map(() => Array(10).fill(''))
  })
  
  // Create HyperFormula instance for formula support
  const hyperformulaInstance = HyperFormula.buildEmpty({
    licenseKey: 'internal-use-in-handsontable'
  })

  // Handsontable settings
  const hotSettings: Handsontable.GridSettings = {
    data: data,
    colHeaders: true,
    rowHeaders: true,
    width: '100%',
    height: 600,
    licenseKey: 'non-commercial-and-evaluation',
    
    // Formula support - KEY FEATURE for accounting
    formulas: {
      engine: hyperformulaInstance
    },
    
    // Enable essential Excel-like features
    contextMenu: true,
    manualColumnResize: true,
    manualRowResize: true,
    mergeCells: true,
    copyPaste: true,
    undo: true,
    
    // Custom cell renderer for better formatting
    cells: function(row, col) {
      const cellProperties: any = {}
      const cellData = this.instance.getDataAtCell(row, col)
      
      // Auto-format currency cells
      if (typeof cellData === 'number' && cellData > 1000) {
        cellProperties.type = 'numeric'
        cellProperties.numericFormat = {
          pattern: '₹0,0.00',
          culture: 'en-IN'
        }
      }
      
      // Style header rows (first 5 rows) differently
      if (row < 3) {
        cellProperties.className = 'htCenter htMiddle header-cell'
      }
      
      return cellProperties
    },
    
    // Track changes
    afterChange: (changes, source) => {
      if (source !== 'loadData') {
        setHasChanges(true)
        console.log('Data changed:', changes)
      }
    },
    
    // Track cell selection
    afterSelection: (row, column, row2, column2) => {
      const colLetter = String.fromCharCode(65 + column)
      setSelectedCell(`${colLetter}${row + 1}`)
    },
    
    // Prevent editing if submitted
    readOnly: isSubmitted,
    
    // Column widths
    colWidths: [150, 120, 120, 120, 120, 100, 100, 100, 100, 100],
    
    // Row heights
    rowHeights: 25,
    
    // Allow overflow for long text
    className: 'htLeft htMiddle'
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const hot = hotTableRef.current?.hotInstance
      if (!hot) {
        throw new Error('Spreadsheet not initialized')
      }

      // Get all data from Handsontable
      const spreadsheetData = hot.getData()
      
      // Extract formulas
      const formulas: string[] = []
      for (let row = 0; row < spreadsheetData.length; row++) {
        for (let col = 0; col < spreadsheetData[row].length; col++) {
          const cellMeta = hot.getCellMeta(row, col)
          if (cellMeta && cellMeta.type === 'formula') {
            const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`
            const formula = hot.getDataAtCell(row, col)
            formulas.push(`${cellRef}: ${formula}`)
          }
        }
      }

      // Count non-empty cells
      const nonEmptyCells = spreadsheetData.flat().filter((cell: any) => 
        cell !== null && cell !== undefined && cell !== ''
      ).length

      const summary = `Spreadsheet with ${spreadsheetData.length} rows and ${spreadsheetData[0]?.length || 0} columns. ${nonEmptyCells} non-empty cells. ${formulas.length} formulas used.`

      const submissionData = {
        cells: spreadsheetData,
        formulas: formulas,
        summary: summary
      }

      console.log('Submitting data:', submissionData)
      
      await onSubmit(submissionData)
      setHasChanges(false)
      toast.success('Solution submitted successfully!')
    } catch (error: any) {
      console.error('Error submitting:', error)
      toast.error(error.message || 'Failed to submit solution')
    } finally {
      setSubmitting(false)
    }
  }

  const resetSheet = () => {
    if (confirm('Are you sure you want to reset the spreadsheet? All changes will be lost.')) {
      const hot = hotTableRef.current?.hotInstance
      if (hot) {
        hot.loadData(Array(25).fill(null).map(() => Array(10).fill('')))
        setHasChanges(false)
        toast.success('Spreadsheet reset')
      }
    }
  }

  const saveProgress = () => {
    const hot = hotTableRef.current?.hotInstance
    if (hot) {
      const data = hot.getData()
      localStorage.setItem(
        `excel_progress_${questionId}`,
        JSON.stringify({ data, timestamp: Date.now() })
      )
      setHasChanges(false)
      toast.success('Progress saved locally')
    }
  }

  const loadProgress = () => {
    const saved = localStorage.getItem(`excel_progress_${questionId}`)
    if (saved) {
      const { data: savedData } = JSON.parse(saved)
      const hot = hotTableRef.current?.hotInstance
      if (hot) {
        hot.loadData(savedData)
        setHasChanges(false)
        toast.success('Progress loaded')
      }
    } else {
      toast.error('No saved progress found')
    }
  }

  const downloadAsCSV = () => {
    const hot = hotTableRef.current?.hotInstance
    if (hot) {
      const plugin = hot.getPlugin('exportFile')
      plugin.downloadFile('csv', {
        filename: `excel_solution_${questionId}`,
        columnHeaders: true,
        rowHeaders: true
      })
      toast.success('Downloaded as CSV')
    }
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {instructions}
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      {!isSubmitted && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Selected Cell Info */}
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Table className="w-4 h-4" />
                  <span className="font-semibold">Selected Cell:</span>
                  <Badge variant="outline">{selectedCell}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calculator className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Formulas Supported: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">=SUM()</code> <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">=IF()</code> etc.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveProgress}
                  className="flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  Save Progress
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadProgress}
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Load Progress
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAsCSV}
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSheet}
                  className="flex items-center gap-1 text-red-600"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>

              {/* Tips */}
              <div className="text-xs text-gray-500 pt-2 border-t">
                <strong>Tips:</strong> Use Excel formulas like <code>=SUM(B2:B5)</code>, <code>=B2*0.30</code>, <code>=B2-B3</code>. 
                Right-click for more options. Press Tab to move between cells.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Handsontable Spreadsheet */}
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <div className="handsontable-container">
            <HotTable
              ref={hotTableRef}
              settings={hotSettings}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button or Evaluation */}
      {isSubmitted && evaluation ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Solution Evaluated
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-lg font-semibold">Score:</span>
                <Badge className="text-2xl px-4 py-2 bg-green-600">
                  {evaluation.score}/10
                </Badge>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Correctness
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {evaluation.correctness_score || 0}%
                  </div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Formula Accuracy
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    {evaluation.formula_accuracy || 0}%
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Formatting
                  </div>
                  <div className="text-lg font-bold text-yellow-600">
                    {evaluation.formatting_score || 0}%
                  </div>
                </div>
                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Efficiency
                  </div>
                  <div className="text-lg font-bold text-pink-600">
                    {evaluation.efficiency_score || 0}%
                  </div>
                </div>
              </div>

              {/* Feedback */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  AI Feedback
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  {evaluation.feedback}
                </p>
              </div>

              {/* Mistakes */}
              {evaluation.mistakes && evaluation.mistakes.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2 text-red-600">Mistakes Found:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {evaluation.mistakes.map((mistake: string, idx: number) => (
                      <li key={idx}>{mistake}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2 text-green-600">Suggestions:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {evaluation.suggestions.map((suggestion: string, idx: number) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Try Again Button */}
              <div className="pt-4">
                <Button
                  onClick={() => window.location.href = '/dashboard/student/excel-assessment'}
                  size="lg"
                  variant="outline"
                  className="w-full text-lg h-12"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Try Again - New Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-lg h-14"
        >
          {submitting ? (
            <>
              <Sparkles className="w-5 h-5 mr-2 animate-spin" />
              Submitting & Evaluating with AI...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Submit Solution for AI Evaluation
            </>
          )}
        </Button>
      )}

      {hasChanges && !isSubmitted && (
        <div className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
          ⚠️ You have unsaved changes
        </div>
      )}

      {/* Formula Help */}
      {!isSubmitted && (
        <Card className="bg-blue-50 dark:bg-blue-900/10">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Common Formulas for P&L Statement:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
              <div><code className="bg-white px-2 py-1 rounded">=B6-B7</code> Gross Profit</div>
              <div><code className="bg-white px-2 py-1 rounded">=B8/B6*100</code> Gross Margin %</div>
              <div><code className="bg-white px-2 py-1 rounded">=B10*0.30</code> Tax Calculation</div>
              <div><code className="bg-white px-2 py-1 rounded">=SUM(B2:B5)</code> Sum Range</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
