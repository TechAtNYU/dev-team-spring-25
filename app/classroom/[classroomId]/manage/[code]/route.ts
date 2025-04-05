import { NextResponse, NextRequest } from "next/server";
import { createServiceClient } from "@/utils/supabase/service-server";
import { getCurrentUserId } from "@/app/lib/userContext/contextFetcher";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  //await params
  const { code } = await params;

  //bypass RLS
  const supabase = createServiceClient();

  //get classroom with code
  const { data: classroom, error: classroomError } = await supabase
    .from("Classrooms")
    .select("*")
    .eq("join_code", code)
    .single();

  if (classroomError || !classroom) {
    console.error("Classroom not found:", classroomError);
    return NextResponse.redirect(new URL("/classroom", request.url));
  }

  //ensures that the user is authenticated
  const userId = await getCurrentUserId();

  if (!userId) {
    console.error("User is not authenticated");
    //login page
    return NextResponse.redirect(new URL("/login", request.url));
  }

  //if the person is already in there, should be redirect to just classroom
  const { data: existingMember, error: memberError } = await supabase
    .from("Classroom_Members")
    .select("id")
    .eq("classroom_id", classroom.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError) {
    console.error("Error checking membership:", memberError);
    return NextResponse.redirect(new URL("/classroom", request.url));
  }

  if (existingMember) {
    return NextResponse.redirect(new URL("/classroom", request.url));
  }

  const { error: insertError } = await supabase
    .from("Classroom_Members")
    .insert({
      classroom_id: classroom.id,
      user_id: userId,
    });

  if (insertError) {
    console.error("Error adding member to classroom:", insertError);
    return NextResponse.redirect(new URL("/classroom", request.url));
  }
  //redirect to classroom

  const success_url = new URL("/classroom", request.url);
  success_url.searchParams.append("delete_success", classroom.id.toString());
  return NextResponse.redirect(success_url);
}
