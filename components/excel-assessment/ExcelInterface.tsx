"use client"

import React, { useState, useRef, useCallback } from 'react'
import { HotTable } from '@handsontable/react'
import { registerAllModules } from 'handsontable/registry'
import Handsontable from 'handsontable'
import { HyperFormula } from 'hyperformula'
import 'handsontable/dist/handsontable.full.min.css'
import './HandsontableStyles.css'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle, AlertCircle, Sparkles, Save,
  RotateCcw, Download, Calculator, Table, Trophy, Loader as LoaderIcon
} from 'lucide-react'
import { Loader } from '@/components/ui/loader'
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
    cells: function (row, col) {
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
    <div className="space-y-6">
      {/* Top Section: Instructions & Formulas */}
      {!isSubmitted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Instructions - Left */}
          <Card className="h-full border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                {instructions}
              </div>
            </CardContent>
          </Card>

          {/* Common Formulas - Right */}
          <Card className="h-full border-l-4 border-l-green-500 shadow-sm bg-green-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-green-600" />
                Common Formulas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Sum Range</span>
                  <code className="text-xs bg-gray-100 text-green-700 px-2 py-1 rounded border border-gray-200">=SUM(B2:B10)</code>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Average</span>
                  <code className="text-xs bg-gray-100 text-green-700 px-2 py-1 rounded border border-gray-200">=AVERAGE(B2:B10)</code>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Subtract</span>
                  <code className="text-xs bg-gray-100 text-green-700 px-2 py-1 rounded border border-gray-200">=B2-B3</code>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Percentage</span>
                  <code className="text-xs bg-gray-100 text-green-700 px-2 py-1 rounded border border-gray-200">=B2*0.15</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selected Cell Bar */}
      {!isSubmitted && (
        <div className="w-full bg-[#EBF5FF] border-2 border-dashed border-[#007AFF] rounded-xl p-4 flex items-center justify-between animate-in fade-in duration-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Table className="w-5 h-5 text-[#007AFF]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-blue-500 font-bold uppercase tracking-wider">Active Selection</span>
              <span className="text-lg font-bold text-gray-900">Selected Cell: {selectedCell}</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-blue-600">
            <Sparkles className="w-4 h-4" />
            <span>AI Formula Assistant Active</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {!isSubmitted && (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveProgress} className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={loadProgress} className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Load
          </Button>
          <Button variant="outline" size="sm" onClick={downloadAsCSV} className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300">
            <Table className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <div className="flex-1"></div>
          <Button variant="outline" size="sm" onClick={resetSheet} className="bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Sheet
          </Button>
        </div>
      )}

      {/* Handsontable Spreadsheet */}
      <Card className="overflow-hidden shadow-lg border-2 border-gray-200 rounded-xl">
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
          <Card className="border-l-4 border-l-green-500 shadow-md">
            <CardHeader className="bg-green-50/50">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Solution Evaluated
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Score */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-gray-900">Assessment Score</h3>
                  <p className="text-gray-500 text-sm">Based on correctness and efficiency</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-green-600">{evaluation.score}</span>
                  <span className="text-gray-400 font-medium">/10</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Correctness', val: evaluation.correctness_score, color: 'blue' },
                  { label: 'Formulas', val: evaluation.formula_accuracy, color: 'purple' },
                  { label: 'Formatting', val: evaluation.formatting_score, color: 'yellow' },
                  { label: 'Efficiency', val: evaluation.efficiency_score, color: 'pink' }
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-xl text-center border ${stat.color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                      stat.color === 'purple' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                        stat.color === 'yellow' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                          'bg-pink-50 border-pink-100 text-pink-700'
                    }`}>
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">
                      {stat.label}
                    </div>
                    <div className="text-2xl font-bold">
                      {stat.val || 0}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback Section */}
              <div className="space-y-4">
                <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="font-bold flex items-center gap-2 text-blue-800 mb-2">
                    <Sparkles className="w-4 h-4" />
                    AI Feedback
                  </h4>
                  <p className="text-blue-900/80 leading-relaxed">
                    {evaluation.feedback}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evaluation.mistakes?.length > 0 && (
                    <div className="p-5 bg-red-50 rounded-xl border border-red-100">
                      <h4 className="font-bold flex items-center gap-2 text-red-800 mb-3">
                        <AlertCircle className="w-4 h-4" />
                        Mistakes Found
                      </h4>
                      <ul className="space-y-2">
                        {evaluation.mistakes.map((m: string, i: number) => (
                          <li key={i} className="flex gap-2 text-sm text-red-700/90">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.suggestions?.length > 0 && (
                    <div className="p-5 bg-green-50 rounded-xl border border-green-100">
                      <h4 className="font-bold flex items-center gap-2 text-green-800 mb-3">
                        <Trophy className="w-4 h-4" />
                        Suggestions
                      </h4>
                      <ul className="space-y-2">
                        {evaluation.suggestions.map((s: string, i: number) => (
                          <li key={i} className="flex gap-2 text-sm text-green-700/90">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0"></span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <Button
                  onClick={() => window.location.href = '/dashboard/student/excel-assessment'}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:px-8 transition-all"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start New Practice Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[#00A76F] hover:bg-[#008f5d] text-white text-lg font-bold py-8 rounded-xl shadow-lg shadow-green-200 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
        >
          {submitting ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              Evaluating Solution with AI...
            </>
          ) : (
            <>
              <span className="text-xl">Submit Solution for AI Evaluation</span>
              <Sparkles className="w-6 h-6" />
            </>
          )}
        </Button>
      )}

      {hasChanges && !isSubmitted && (
        <div className="text-center animate-pulse text-yellow-600 text-sm font-medium">
          ⚠️ You have unsaved changes in the spreadsheet
        </div>
      )}
    </div>
  )
}
