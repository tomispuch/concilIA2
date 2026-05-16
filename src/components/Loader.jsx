export default function Loader({ message = 'Procesando...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-[#082e56] rounded-full animate-spin" />
      <p className="text-[#082e56] font-medium text-sm">{message}</p>
    </div>
  )
}
