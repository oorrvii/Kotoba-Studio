export default function FlipCard({ flipped, onToggle, front, back }) {
  return (
    <div onClick={onToggle} className="h-full w-full cursor-pointer [perspective:1800px]">
      <div className={`relative h-full w-full transition-transform duration-500 ease-out [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
        <div aria-hidden={flipped} className="absolute inset-0 [backface-visibility:hidden]">{front}</div>
        <div aria-hidden={!flipped} className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">{back}</div>
      </div>
    </div>
  )
}
