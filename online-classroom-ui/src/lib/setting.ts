export const ITEM_PER_PAGE = 8

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)": ["admin"],
  "/students(.*)": ["students"],
  "/teachers(.*)": ["teachers"],
  "/parent(.*)": ["parent"],
  "/list/teachers": ["admin", "teachers"],
  "/list/students": ["admin", "teachers"],
  "/list/parents": ["admin", "teachers"],
  "/list/subjects": ["admin"],
  "/list/classes": ["admin", "teacher"],
  "/list/exams": ["admin", "teacher", "students", "parent"],
  "/list/assignments": ["admin", "teacher", "students", "parent"],
  "/list/results": ["admin", "teacher", "students", "parent"],
  "/list/attendance": ["admin", "teacher", "students", "parent"],
  "/list/events": ["admin", "teacher", "students", "parent"],
  "/list/announcements": ["admin", "teacher", "students", "parent"],
};