import { isUserAdminForClassroom } from "./actions";
import UploadComponent from "./uploadComponent";
import { createClient } from "@shared/utils/supabase/server";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;
  const isAdmin = await isUserAdminForClassroom(Number(classroomId));
  if (!isAdmin) {
    return (
      <h1> Not the admin for this classroom! But change this to 404 page </h1>
    );
  }

  // #TODO: move this out to general supabase place
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Classrooms")
    .select("name")
    .eq("id", Number(classroomId))
    .single();

  if (error || !data || !data.name) {
    console.error("Error fetching classroom or its name:", error);
    return <h1> Insert 404 page here</h1>;
  }

  return (
    <>
      <h1>Classroom: {data.name}</h1>
      <UploadComponent classroomId={classroomId} classroomName={data.name} />
    </>
  );
}
