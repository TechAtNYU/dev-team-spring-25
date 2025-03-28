import { signInWithGoogle } from "../auth/actions";
import GoogleSignInButton from "@shared/components/GoogleSignInButton";

export default async function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <form action={signInWithGoogle}>
          <GoogleSignInButton />
        </form>
      </div>
    </div>
  );
}
