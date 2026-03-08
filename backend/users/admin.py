from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import StudentProfile, TeacherProfile, User


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    extra = 0


class TeacherProfileInline(admin.StackedInline):
    model = TeacherProfile
    extra = 0


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    inlines = (StudentProfileInline, TeacherProfileInline)
    fieldsets = UserAdmin.fieldsets + (
        (
            'Role & Academic Access',
            {
                'fields': (
                    'full_name',
                    'role',
                    'student_id',
                    'field_of_study',
                    'semester_code',
                    'semester_number',
                    'section',
                    'department',
                    'teacher_department',
                    'teacher_designation',
                    'assigned_fields',
                    'assigned_semester_codes',
                    'assigned_semester_numbers',
                    'academic_year',
                    'is_verified',
                    'university_domain_verified',
                    'created_at',
                    'updated_at',
                )
            },
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': ('email', 'username', 'password1', 'password2', 'role', 'is_staff', 'is_superuser'),
            },
        ),
    )
    readonly_fields = ('created_at', 'updated_at')
    list_display = (
        'email',
        'full_name',
        'role',
        'student_id',
        'field_of_study',
        'semester_code',
        'semester_number',
        'section',
        'is_active',
        'is_staff',
    )
    search_fields = ('email', 'username', 'full_name', 'student_id')
    list_filter = ('role', 'is_active', 'is_staff', 'field_of_study', 'semester_code', 'semester_number', 'section')
    ordering = ('email',)
    filter_horizontal = ('assigned_fields', 'groups', 'user_permissions')


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'university', 'faculty', 'semester', 'group', 'student_id')
    search_fields = ('user__email', 'user__full_name', 'student_id', 'faculty', 'group')


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'university', 'department', 'employee_id', 'subject_area')
    search_fields = ('user__email', 'user__full_name', 'employee_id', 'department', 'subject_area')
