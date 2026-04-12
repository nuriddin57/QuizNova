from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserChangeForm, CustomUserCreationForm
from .models import StudentProfile, TeacherProfile, User


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    extra = 0


class TeacherProfileInline(admin.StackedInline):
    model = TeacherProfile
    extra = 0


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User
    inlines = (StudentProfileInline, TeacherProfileInline)
    fieldsets = UserAdmin.fieldsets + (
        (
            'Role & Academic Access',
            {
                'fields': (
                    'full_name',
                    'avatar',
                    'school',
                    'language_preference',
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
                'fields': ('email', 'full_name', 'role', 'is_active', 'is_staff', 'is_superuser', 'password1', 'password2'),
            },
        ),
    )
    readonly_fields = ('created_at', 'updated_at')
    list_display = (
        'email',
        'full_name',
        'role',
        'student_identifier',
        'field_of_study_name',
        'semester_code',
        'semester_number',
        'section_name',
        'verification_status',
        'is_active',
        'is_staff',
    )
    search_fields = ('email', 'username', 'full_name', 'student_id', 'section', 'field_of_study__name')
    list_filter = ('role', 'is_active', 'is_staff', 'field_of_study', 'semester_code', 'semester_number', 'section')
    ordering = ('email',)
    list_select_related = ('field_of_study',)
    filter_horizontal = ('assigned_fields', 'groups', 'user_permissions')

    @admin.display(description='Student ID', ordering='student_id')
    def student_identifier(self, obj):
        return obj.student_id or '-'

    @admin.display(description="Yo'nalish", ordering='field_of_study__name')
    def field_of_study_name(self, obj):
        return getattr(obj.field_of_study, 'name', '-') or '-'

    @admin.display(description='Section', ordering='section')
    def section_name(self, obj):
        return obj.section or '-'

    @admin.display(description='Verified')
    def verification_status(self, obj):
        return 'Yes' if obj.is_verified_university_user() else 'No'


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'university', 'faculty', 'semester', 'group', 'student_id')
    search_fields = ('user__email', 'user__full_name', 'student_id', 'faculty', 'group', 'user__field_of_study__name')
    list_filter = ('semester', 'faculty', 'group')
    list_select_related = ('user', 'user__field_of_study')


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'university', 'department', 'employee_id', 'subject_area')
    search_fields = ('user__email', 'user__full_name', 'employee_id', 'department', 'subject_area')
    list_filter = ('department', 'subject_area')
    list_select_related = ('user',)

