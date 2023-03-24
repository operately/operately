import React from "react";

function Member({name}) {
  const initials = name.split(" ").map((part) => part[0]).join("")

  const colors = [
    "bg-[#89CFF0]",
    "bg-[#FFDAB9]",
    "bg-[#E6E6FA]",
    "bg-[#98FB98]",
    "bg-[#FADADD]",
    "bg-[#FFF8DC]",
    "bg-[#C8A2C8]",
    "bg-[#FFFF99]",
    "bg-[#87CEEB]",
    "bg-[#F08080]",
    "bg-[#DCD0FF]",
    "bg-[#B0E0E6]",
    "bg-[#FFDAB9]"
  ]

  const colorSum = name.split("").map((c) => c.charCodeAt(0)).reduce((acc, c) => acc + c)
  const colorIndex = colorSum % colors.length;
  const classes = "flex items-center justify-center w-8 h-8 rounded-full font-bold"

  return (
    <div key="id" className={`${colors[colorIndex]} ${classes}`}>
      <span>{initials}</span>
    </div>
  )
}

export default ({members, total}) => {
  const hiddenCount = total - members.length;

  return (
    <div className="flex items-center gap-2">
      {members.map((m) => (
        <Member key={m.id + Math.random()} name={m.full_name} />
      ))}

      {hiddenCount > 0 ? `+ ${hiddenCount} others` : ""}
    </div>
  );
}
