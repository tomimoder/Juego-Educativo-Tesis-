import { Card } from "../ui/card"
import { Trophy } from "lucide-react"

export default function Scoreboard({ scores }) {
  const getRowColor = (position) => {
    const colors = {
      1: "bg-cyan-100 hover:bg-cyan-200",
      2: "bg-cyan-50 hover:bg-cyan-100",
      3: "bg-emerald-50 hover:bg-emerald-100",
      4: "bg-amber-50 hover:bg-amber-100",
      5: "bg-amber-50 hover:bg-amber-100",
      6: "bg-rose-50 hover:bg-rose-100",
      7: "bg-rose-50 hover:bg-rose-100",
      8: "bg-violet-50 hover:bg-violet-100",
      9: "bg-violet-50 hover:bg-violet-100",
    }
    return colors[position] || "bg-gray-50 hover:bg-gray-100"
  }

  return (
    <Card className="w-full max-w-2xl p-6 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="space-y-2">
        <div className="grid grid-cols-12 text-sm font-semibold text-white mb-4">
          <div className="col-span-2 text-center">POSITION</div>
          <div className="col-span-8 px-4">NAME</div>
          <div className="col-span-2 text-center">POINTS</div>
        </div>
        {scores.map((score) => (
          <div
            key={score.position}
            className={`grid grid-cols-12 items-center rounded-lg ${getRowColor(
              score.position,
            )} transition-colors duration-200 p-2`}
          >
            <div className="col-span-2 text-center font-bold text-gray-700">{score.position}</div>
            <div className="col-span-8 px-4 flex items-center gap-2 text-gray-700">
              <Trophy className="h-4 w-4" />
              {score.teamName}
            </div>
            <div className="col-span-2 text-center font-semibold text-gray-700">{score.points}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

