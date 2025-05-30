import { ReadonlyURLSearchParams } from "next/navigation";

type PageStructure =
  | PickOne<{
      classroomLanding: PickOne<{
        enrolled: boolean;
        admin: boolean;
      }>;
      activeClassroom: {
        id: number;
        activeSubPage:
          | PickOne<{
              manageClassroomPage: {
                uploadClassroomPage: boolean;
              };
              personalChatPage: boolean;
              chatroomListPage: boolean;
            }>
          | undefined;
      };
    }>
  | undefined;

// TODO: once structure is finalized, fix this
export function getPageAspectsByPath(
  pathname: string,
  searchParams: ReadonlyURLSearchParams
): PageStructure {
  if (pathname == "/") {
    return undefined;
  }

  const split = pathname.split("/");

  if (pathname.includes("classroom") && split.length == 2) {
    const tab = searchParams.get("tab");
    if (tab && tab === "admin") {
      return { classroomLanding: { admin: true } };
    }
    return { classroomLanding: { enrolled: true } };
  }

  const id = split[2];
  let subPage = undefined;
  if (split.length >= 4) {
    // TODO: after adding manage page and moving chat/chatrooms into classroom -> add to here
    subPage = { manageClassroomPage: { uploadClassroomPage: true } };
  }

  return { activeClassroom: { id: Number(id), activeSubPage: subPage } };
}

type PickOne<T> = {
  [K in keyof T]: Record<K, T[K]> & Partial<Record<Exclude<keyof T, K>, never>>;
}[keyof T];
