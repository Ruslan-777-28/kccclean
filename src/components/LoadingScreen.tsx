export default function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="text-center text-xl opacity-80">{message}</div>
    </div>
  );
}
