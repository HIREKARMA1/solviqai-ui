import { circuitComponents, CircuitComponent } from '@/lib/electrical/components'

export function CircuitComponentsLibrary() {
  const handleDragStart = (componentName: string, event: React.DragEvent) => {
    event.dataTransfer.setData('application/circuit-component', componentName)
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-4 bg-white rounded border">
      <h3 className="col-span-2 text-sm font-semibold mb-2">Circuit Components</h3>
      {Object.entries(circuitComponents).map(([name, component]) => (
        <div
          key={name}
          draggable
          onDragStart={(e) => handleDragStart(name, e)}
          className="flex items-center justify-center p-2 border rounded hover:bg-gray-50 cursor-move"
        >
          <span className="text-xs">{name}</span>
        </div>
      ))}
    </div>
  )
}