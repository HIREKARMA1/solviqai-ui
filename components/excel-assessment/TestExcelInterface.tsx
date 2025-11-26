"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import ExcelInterfaceHandsontable from './ExcelInterfaceHandsontable'

/**
 * Test page for the new Handsontable Excel Interface
 * Use this to test the P&L statement scenario
 */
export default function TestExcelInterface() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [evaluation, setEvaluation] = useState<any>(null)

  const handleSubmit = async (spreadsheetData: any) => {
    console.log('Submitted data:', spreadsheetData)
    
    // Simulate AI evaluation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock evaluation response
    const mockEvaluation = {
      score: 8.5,
      correctness_score: 85,
      formula_accuracy: 90,
      formatting_score: 80,
      efficiency_score: 85,
      feedback: "Excellent work on your P&L statement! Your formulas are mostly correct, and you've used proper accounting formatting. Consider using absolute cell references ($B$6) for all percentage calculations to make your formulas more robust.",
      mistakes: [
        "Cell C13: Missing absolute reference for Revenue cell in percentage calculation",
        "Cell B20: Tax calculation could use a named cell reference for better readability"
      ],
      suggestions: [
        "Use borders to separate major sections (Gross Profit, Operating Profit, Net Profit)",
        "Consider adding bold formatting to profit line items",
        "Add a summary section at the bottom with key financial ratios"
      ]
    }
    
    setEvaluation(mockEvaluation)
    setIsSubmitted(true)
  }

  const handleReset = () => {
    setIsSubmitted(false)
    setEvaluation(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    Excel Assessment - Handsontable Test
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Testing the new Handsontable implementation with P&L Statement scenario
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Intermediate
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">Time Limit:</span>
                  <span>20 minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">Max Score:</span>
                  <span>10 points</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">Formulas Required:</span>
                  <span>Yes (8 minimum)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Excel Interface */}
        <ExcelInterfaceHandsontable
          questionId="test-pl-statement"
          assessmentId="test-assessment"
          instructions="Complete the Profit & Loss Statement by adding the required formulas."
          sampleData={undefined}
          onSubmit={handleSubmit}
          isSubmitted={isSubmitted}
          evaluation={evaluation}
        />

        {/* Reset Button for Testing */}
        {isSubmitted && (
          <div className="mt-4">
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full"
            >
              Reset and Try Again
            </Button>
          </div>
        )}

        {/* Feature Checklist */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">✅ Handsontable Features to Test:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Formula Features:</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>✓ Type formulas like: <code>=B6+B7</code></li>
                  <li>✓ Use SUM: <code>=SUM(B2:B5)</code></li>
                  <li>✓ Percentage: <code>=B8/B6*100</code></li>
                  <li>✓ Absolute refs: <code>=$B$6</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Interaction Features:</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>✓ Right-click for context menu</li>
                  <li>✓ Copy/Paste (Ctrl+C / Ctrl+V)</li>
                  <li>✓ Undo/Redo (Ctrl+Z / Ctrl+Y)</li>
                  <li>✓ Tab to move between cells</li>
                  <li>✓ Drag column/row edges to resize</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Formatting:</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>✓ Currency formatting (₹)</li>
                  <li>✓ Number formatting</li>
                  <li>✓ Cell alignment</li>
                  <li>✓ Cell merging (via context menu)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Save/Load:</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>✓ Save progress locally</li>
                  <li>✓ Load saved progress</li>
                  <li>✓ Export as CSV</li>
                  <li>✓ Reset spreadsheet</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions for Students */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-lg">📝 Sample Solution Guide:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Cell B9 (Gross Profit):</strong> <code>=B6+B7</code> (COGS is negative)</p>
            <p><strong>Cell C9 (Gross Margin %):</strong> <code>=B9/$B$6*100</code></p>
            <p><strong>Cell B13 (Operating Profit):</strong> <code>=B9+B11</code></p>
            <p><strong>Cell C13 (Operating Margin %):</strong> <code>=B13/$B$6*100</code></p>
            <p><strong>Cell B18 (PBT):</strong> <code>=B13+B16</code></p>
            <p><strong>Cell B20 (Tax):</strong> <code>=B18*0.30</code></p>
            <p><strong>Cell B22 (Net Profit):</strong> <code>=B18-B20</code></p>
            <p><strong>Cell C22 (Net Margin %):</strong> <code>=B22/$B$6*100</code></p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
