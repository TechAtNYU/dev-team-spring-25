import { isUserAdminForClassroom } from "./actions";
import UploadComponent from "./uploadComponent";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;
  const isAdmin = await isUserAdminForClassroom(Number(classroomId));
  if (!isAdmin) {
    return <h1> Not the admin for this classroom! </h1>;
  }
  return <UploadComponent classroomId={classroomId} />;
}
