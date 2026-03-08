from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _normalize_username(self, username, email):
        candidate = (username or '').strip()
        if candidate:
            return candidate

        email_value = self.normalize_email(email or '')
        local_part = (email_value.split('@')[0] if email_value else 'user').strip() or 'user'
        base = slugify(local_part).replace('-', '_') or 'user'
        final = base
        suffix = 1
        while self.model.objects.filter(username=final).exists():
            suffix += 1
            final = f'{base}_{suffix}'
        return final

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('Email is required.')
        email = self.normalize_email(email)
        extra_fields['email'] = email
        extra_fields['username'] = self._normalize_username(extra_fields.get('username'), email)
        user = self.model(**extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', User.ROLE_ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('university_domain_verified', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_STUDENT = 'student'
    ROLE_TEACHER = 'teacher'
    ROLE_ADMIN = 'admin'
    ROLE_CHOICES = [
        (ROLE_STUDENT, 'Student'),
        (ROLE_TEACHER, 'Teacher'),
        (ROLE_ADMIN, 'Admin'),
    ]

    email = models.EmailField('email address', unique=True, db_index=True)
    full_name = models.CharField(max_length=255, blank=True)
    student_id = models.CharField(max_length=32, blank=True, null=True, unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_STUDENT)
    field_of_study = models.ForeignKey(
        'fields.StudyField',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='users',
    )
    semester_code = models.CharField(max_length=20, blank=True, db_index=True)
    semester_number = models.PositiveSmallIntegerField(null=True, blank=True, db_index=True)
    department = models.CharField(max_length=120, blank=True)
    teacher_department = models.CharField(max_length=120, blank=True)
    teacher_designation = models.CharField(max_length=120, blank=True)
    assigned_fields = models.ManyToManyField(
        'fields.StudyField',
        blank=True,
        related_name='assigned_teachers',
    )
    assigned_semester_codes = models.JSONField(default=list, blank=True)
    assigned_semester_numbers = models.JSONField(default=list, blank=True)
    academic_year = models.CharField(max_length=30, blank=True)
    section = models.CharField(max_length=50, blank=True)
    is_verified = models.BooleanField(default=False)
    university_domain_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = UserManager()

    def save(self, *args, **kwargs):
        self.email = User.objects.normalize_email(self.email or '')
        if not self.username:
            self.username = User.objects._normalize_username('', self.email)
        if not self.full_name:
            composed = f'{self.first_name} {self.last_name}'.strip()
            self.full_name = composed
        super().save(*args, **kwargs)

    def is_student(self):
        return self.role == self.ROLE_STUDENT

    def is_teacher(self):
        return self.role == self.ROLE_TEACHER

    def is_admin(self):
        return self.role == self.ROLE_ADMIN or self.is_staff

    def is_verified_university_user(self):
        return bool(self.is_verified and self.university_domain_verified)

    @property
    def profile(self):
        if self.is_student():
            return getattr(self, 'student_profile', None)
        if self.is_teacher() or self.is_admin():
            return getattr(self, 'teacher_profile', None)
        return None


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    university = models.CharField(max_length=255, blank=True)
    faculty = models.CharField(max_length=255, blank=True)
    semester = models.PositiveSmallIntegerField(null=True, blank=True)
    group = models.CharField(max_length=50, blank=True)
    student_id = models.CharField(max_length=32, blank=True, db_index=True)

    def save(self, *args, **kwargs):
        if self.student_id and self.user.student_id != self.student_id:
            self.user.student_id = self.student_id
        if self.semester and self.user.semester_number != self.semester:
            self.user.semester_number = self.semester
        if self.group and self.user.section != self.group:
            self.user.section = self.group
        self.user.save(update_fields=['student_id', 'semester_number', 'section', 'updated_at'])
        super().save(*args, **kwargs)

    def __str__(self):
        return f'StudentProfile<{self.user.email}>'


class TeacherProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    university = models.CharField(max_length=255, blank=True)
    department = models.CharField(max_length=255, blank=True)
    employee_id = models.CharField(max_length=32, blank=True, db_index=True)
    subject_area = models.CharField(max_length=255, blank=True)

    def save(self, *args, **kwargs):
        update_fields = []
        if self.department and self.user.teacher_department != self.department:
            self.user.teacher_department = self.department
            update_fields.append('teacher_department')
        if self.subject_area and self.user.department != self.subject_area:
            self.user.department = self.subject_area
            update_fields.append('department')
        if update_fields:
            update_fields.append('updated_at')
            self.user.save(update_fields=update_fields)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'TeacherProfile<{self.user.email}>'


@receiver(post_save, sender=User)
def ensure_role_profiles(sender, instance, created, **kwargs):
    if instance.is_student():
        profile, updated = StudentProfile.objects.get_or_create(
            user=instance,
            defaults={
                'semester': instance.semester_number,
                'group': instance.section,
                'student_id': instance.student_id or '',
            },
        )
        dirty = False
        if instance.student_id and profile.student_id != instance.student_id:
            profile.student_id = instance.student_id
            dirty = True
        if instance.semester_number and profile.semester != instance.semester_number:
            profile.semester = instance.semester_number
            dirty = True
        if instance.section and profile.group != instance.section:
            profile.group = instance.section
            dirty = True
        if dirty and not created:
            StudentProfile.objects.filter(pk=profile.pk).update(
                student_id=profile.student_id,
                semester=profile.semester,
                group=profile.group,
            )

    if instance.is_teacher() or instance.is_admin():
        profile, created = TeacherProfile.objects.get_or_create(
            user=instance,
            defaults={
                'department': instance.teacher_department,
                'subject_area': instance.department,
            },
        )
        dirty = False
        if instance.teacher_department and profile.department != instance.teacher_department:
            profile.department = instance.teacher_department
            dirty = True
        if instance.department and profile.subject_area != instance.department:
            profile.subject_area = instance.department
            dirty = True
        if dirty and not created:
            TeacherProfile.objects.filter(pk=profile.pk).update(
                department=profile.department,
                subject_area=profile.subject_area,
            )
