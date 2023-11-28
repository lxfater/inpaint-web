interface ProgressProps {
  percent: number
}

export default function Progress({ percent }: ProgressProps) {
  return (
    <div className="w-full flex items-center">
      <div className="relative flex-1 bg-black/20 h-2 mr-4">
        <div
          className="absolute left-0 top-0 h-full bg-black duration-100"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-20 text-right">{percent.toFixed(2)}%</span>
    </div>
  )
}
