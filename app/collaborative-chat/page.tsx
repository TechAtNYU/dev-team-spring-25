import CollaborativeChat from "./components/collaborative-chat";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gray-50">
      <div className="w-full max-w-4xl">
        <CollaborativeChat />
      </div>
    </main>
  );
}
