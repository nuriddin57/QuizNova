from rest_framework.permissions import BasePermission


class IsTeacherRole(BasePermission):
    message = 'Teacher role is required.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and (user.is_teacher() or user.is_admin()))


class IsStudentRole(BasePermission):
    message = 'Student role is required.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and user.is_student())


class IsAdminRole(BasePermission):
    message = 'Admin role is required.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and user.is_admin())


class IsVerifiedUniversityUser(BasePermission):
    message = 'Your university profile is not verified.'

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and user.is_verified_university_user())


# Backward-compatible aliases used elsewhere in the codebase.
IsTeacher = IsTeacherRole
IsStudent = IsStudentRole
